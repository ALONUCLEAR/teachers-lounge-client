import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { getAssociationsByType } from 'src/app/api/server/actions/association-actions';
import { Association, AssociationType } from 'src/app/api/server/types/association';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { setFormArray } from 'src/app/utils/form-utils';
import { PostForm, PostService } from 'src/app/views/forum/school-forum/post.service';
import { SchoolSelectionService } from 'src/app/views/school-selection/school-selection.service';
import { MediaItem, MediaType, Post } from '../../../api/server/types/post';
import { ConvertFileListToMedia, ConvertMediaToFileList } from 'src/app/utils/media-utils';

@Component({
    selector: 'post-form',
    templateUrl: './post-form.component.html',
    styleUrls: ['./post-form.component.less'],
})
export class PostFormComponent implements OnInit {
    @Input({ required: true }) subject: Pick<Association, 'id' | 'name'> = { id: '', name: '' };
    @Input() post?: Post;
    postForm!: FormGroup<PostForm>;
    selectedMediaItems: MediaItem[] = [];
    maxMediaItems = 1;
    acceptedFileTypes = Object.values(MediaType).join(', ');

    associationEntities: Association[] = [];
    isEditing = false;
    authorId!: string;
    isLoading = false;

    constructor(
        private readonly postService: PostService,
        private readonly schoolSelectionService: SchoolSelectionService,
        private readonly authQuery: AuthQuery,
        private readonly modal: NgbActiveModal,
    ) { }

    async ngOnInit(): Promise<void> {
        this.isLoading = true;

        await this.initEntities();
        this.postForm = this.postService.createPostForm(this.post);
        this.selectedMediaItems = this.post?.media ?? [];
        this.isEditing = Boolean(this.post?.id);

        this.isLoading = false;
    }

    private async initEntities(): Promise<void> {
        const schoolId = await this.schoolSelectionService.getSelectedSchoolId("עריכת פוסט");
        const userId = this.authQuery.getUserId()!;

        this.authorId = userId;

        const associations = await getAssociationsByType(userId, AssociationType.Normal, schoolId);
        const subjects = await getAssociationsByType(userId, AssociationType.Subject, schoolId);

        this.associationEntities = [
            ...associations,
            ...subjects.map(subject => ({...subject, name: `${subject.name} (${AssociationType.Subject})`}))
        ];
    }

    async onFilesSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;

        if (input.files) {
            this.selectedMediaItems = await ConvertFileListToMedia(input.files);
        }
    }

    removeMediaItem(index: number): void {
        this.selectedMediaItems = this.selectedMediaItems.filter((_, i) => i !== index);
    }

    updateImportantParticipants(associations: Association[]): void {
        const associationIds = associations.map(({ id }) => id!).filter(Boolean);
        setFormArray(this.postForm.controls.importantParticipants, associationIds);
    }

    async onSubmit(): Promise<void> {
        const selectedFileList = ConvertMediaToFileList(this.selectedMediaItems);

        if (!this.postService.isFormValid(this.postForm, selectedFileList)) {
            return;
        }

        const updatedPost = PostService.serializeForm(this.postForm, this.authorId, this.subject.id!, this.post);

        if (await this.postService.upsertPost(updatedPost, selectedFileList)) {
            this.modal.close(updatedPost);
        }
    }

    close(): void {
        this.modal.close();
    }
}