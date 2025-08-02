import { Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Association } from "src/app/api/server/types/association";
import { Post } from "src/app/api/server/types/post";
import { PostFormComponent } from "src/app/components/post/post-form/post-form.component";
import { PopupService } from "src/app/services/popup.service";
import { AuthQuery } from "src/app/stores/auth/auth.query";

export interface PostForm {
    title: FormControl<string>,
    importantParticipants: FormArray<FormControl<string>>,
    body: FormControl<string>,
}

@Injectable({ providedIn: 'root' })
export class PostService {
    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly popupService: PopupService,
        private readonly authQuery: AuthQuery,
        private readonly modalService: NgbModal,
    ) { }

    createPostForm(post?: Post): FormGroup<PostForm> {
        const importantParticipantForms = (post?.importantParticipants ?? [])
                .map(id => this.formBuilder.control(id, { nonNullable: true }));
    
            return this.formBuilder.group({
                title: this.formBuilder.control(post?.title ?? '', { nonNullable: true, validators: [Validators.required] }),
                importantParticipants: this.formBuilder.array(importantParticipantForms),
                body: this.formBuilder.control(post?.body ?? '', { nonNullable: true, validators: [Validators.required] }),
            });
    }

    static serializeForm(postForm: FormGroup<PostForm>, authorId: string, subjectId: string, previousPostState?: Post): Post {
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
            authorId,
            subjectId,
            title: formValue.title!,
            // importatnParticipants is irrelavent for existing posts
            importantParticipants: isEdit ? undefined : formValue.importantParticipants,
            body: formValue.body!,
            comments: previousPostState?.comments ??[],
            ...timeData
        };
    }

    isFormValid(postFrom: FormGroup<PostForm>): boolean {
        if (postFrom.invalid) {
            this.popupService.error(`שדות לא תקינים`, { title: `שגיאה בשמירת פוסט` });

            return false;
        }

        return true;
    }

    async upsertPost(subject: Pick<Association, 'id' | 'name'>, post?: Post): Promise<void> {
        const modalRef = this.modalService.open(PostFormComponent);
        const componentInstance: PostFormComponent = modalRef.componentInstance;
        componentInstance.subject = subject;
        componentInstance.post = post;

        const resultPost: Post = await modalRef.result;

        if (!resultPost) {
            // didn't save
            return;
        }

        // save
        if (savePost(this.authQuery.getUserId()!, resultPost)) {
            this.popupService.success(`הפוסט נשמר בהצלחה`);
        } else {
            this.popupService.error(`שמירת הפוסט נכשלה`)
        }
    }
}

function savePost(requestingUserId: string, post: Post): boolean {
    console.log({requestingUserId, post});

    return true;
}