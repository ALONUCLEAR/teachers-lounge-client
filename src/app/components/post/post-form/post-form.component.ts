import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { getAssociationsByType } from 'src/app/api/server/actions/association-actions';
import { Association, AssociationType } from 'src/app/api/server/types/association';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { setFormArray } from 'src/app/utils/form-utils';
import { PostForm, PostService } from 'src/app/views/forum/school-forum/post.service';
import { SchoolSelectionService } from 'src/app/views/school-selection/school-selection.service';
import { Post } from '../../../api/server/types/post';

@Component({
    selector: 'post-form',
    templateUrl: './post-form.component.html',
    styleUrls: ['./post-form.component.less'],
})
export class PostFormComponent implements OnInit {
    @Input({ required: true }) subject: Pick<Association, 'id' | 'name'> = { id: '', name: '' };
    @Input() post?: Post;
    postForm!: FormGroup<PostForm>;

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

    updateImportantParticipants(associations: Association[]): void {
        const associationIds = associations.map(({ id }) => id!).filter(Boolean);
        setFormArray(this.postForm.controls.importantParticipants, associationIds);
    }

    async onSubmit(): Promise<void> {
        if (!this.postService.isFormValid(this.postForm)) {
            return;
        }

        const updatedPost = PostService.serializeForm(this.postForm, this.authorId, this.subject.id!, this.post);

        if (await this.postService.upsertPost(updatedPost)) {
            this.modal.close(updatedPost);
        }
    }

    close(): void {
        this.modal.close();
    }
}