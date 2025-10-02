import { Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { tryDeletePost, tryUpsertPost } from "src/app/api/server/actions/post-actions";
import { Association } from "src/app/api/server/types/association";
import { MediaType, Post } from "src/app/api/server/types/post";
import { PostFormComponent } from "src/app/components/post/post-form/post-form.component";
import { ConfirmationService } from "src/app/services/confirmation.service";
import { PopupService } from "src/app/services/popup.service";
import { AuthQuery } from "src/app/stores/auth/auth.query";

export interface PostForm {
    title: FormControl<string>,
    importantParticipants: FormArray<FormControl<string>>,
    body: FormControl<string>,
}

export type ExpandedPost = Post & { importantParticipants?: string[] };

@Injectable({ providedIn: 'root' })
export class PostService {
    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly popupService: PopupService,
        private readonly authQuery: AuthQuery,
        private readonly modalService: NgbModal,
    ) { }

    public static MAX_FILE_SIZE_MB = 15;

    createPostForm(post?: Post): FormGroup<PostForm> {
        return this.formBuilder.group({
            title: this.formBuilder.control(post?.title ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
            importantParticipants: this.formBuilder.array([] as FormControl<string>[]),
            body: this.formBuilder.control(post?.body ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(4095)] }),
        });
    }

    static serializeForm(postForm: FormGroup<PostForm>, authorId: string, subjectId: string, previousPostState?: Post): ExpandedPost {
        const formValue = postForm.value;
        const isEdit = previousPostState?.id;

        const timeData: Pick<Post, 'publishedAt' | 'lastUpdatedAt'> = isEdit
            ? {
                publishedAt: previousPostState.publishedAt,
                lastUpdatedAt: new Date().toISOString(),
            } : {
                publishedAt: new Date().toISOString(),
            };

        return {
            id: previousPostState?.id,
            authorId,
            subjectId,
            title: formValue.title!,
            // importatnParticipants is irrelavent for existing posts
            importantParticipants: isEdit ? undefined : formValue.importantParticipants,
            body: formValue.body!,
            totalChildrenCount: previousPostState?.totalChildrenCount ?? 0,
            ...timeData
        };
    }

    isFormValid(postFrom: FormGroup<PostForm>, selectedFiles: FileList | null): boolean {
        const errorOptions = { title: `שגיאה בשמירת פוסט` };

        if (postFrom.invalid) {
            this.popupService.error(`שדות לא תקינים`, errorOptions);

            return false;
        }

        if (!PostService.isAllMediaValid(selectedFiles)) {
            this.popupService.error(`מדיה לא תקינה בפוסט. שימו לב שגודל קובץ לא יכול לעלות על 15MB בדיוק`, errorOptions);

            return false;
        }

        return true;
    }

    async openPostForm(subject: Pick<Association, 'id' | 'name'>, post?: Post): Promise<ExpandedPost | undefined> {
        const modalRef = this.modalService.open(PostFormComponent);
        const componentInstance: PostFormComponent = modalRef.componentInstance;
        componentInstance.subject = subject;
        componentInstance.post = post;

        try {
            return await modalRef.result;
        } catch {
            // we need to try catch cause there's no modalRef.result if the user clicked outside
        }

        return undefined;
    }


    private static get allowedMediaTypes() {
        return Object.values(MediaType);
    } 

    static isMediaValid(media: File): boolean {
        if (!PostService.allowedMediaTypes.includes(media.type as MediaType)) {
            return false;
        }

        // media.size is in bytes
        const sizeMb = media.size / (1024 * 1024);

        if (sizeMb > PostService.MAX_FILE_SIZE_MB) {
            return false;
        }

        return true;
    }

    static isAllMediaValid(mediaFiles: File[]): boolean
    static isAllMediaValid(mediaFiles: FileList | null | undefined): boolean
    static isAllMediaValid(mediaFiles: File[] | FileList | null | undefined): boolean {
        if (!mediaFiles?.length) {
            // If it's empty it's valid
            return true;
        }

        const files = ('item' in mediaFiles) ? Array.from(mediaFiles) : mediaFiles;

        return files.every(this.isMediaValid);
    }

    async upsertPost(inputPost: ExpandedPost, selectedFiles: FileList | null): Promise<boolean> {
        if (await tryUpsertPost(this.authQuery.getUserId()!, inputPost, selectedFiles, inputPost.importantParticipants)) {
            this.popupService.success(`הפוסט נשמר בהצלחה`);
            return true;
        } else {
            this.popupService.error(`שמירת הפוסט נכשלה`);
            return false;
        }
    }

    async deletePost(postId: string): Promise<boolean> {
        const deletePrompt = `זוהי פעולה בלתי הפיכה. מחיקת הפוסט תמחק גם את כל התגובות המקושרות אליו. האם להמשיך?`;

        if (!await ConfirmationService.didConfirmAction(this.modalService, deletePrompt)) {
            return false;
        }

        if (!await tryDeletePost(this.authQuery.getUserId()!, postId)) {
            this.popupService.error(`מחיקת הפוסט נכשלה`);
            return false;
        } else {
            this.popupService.success(`פוסט נמחק בהצלחה`);
            return true;
        }
    }
}