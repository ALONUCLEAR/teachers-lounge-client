import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Post, Comment } from "src/app/api/server/types/post";
import { DisplayedUser } from 'src/app/api/server/types/user';
import { orderBy } from 'lodash';
import { AuthQuery } from "src/app/stores/auth/auth.query";
import { NgbModal, NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { hasPermissions, UserRoles } from "src/app/api/server/types/permissions";
import { ConfirmationPopupComponent, ConfirmationResult } from "../ui/confirmation-popup/confirmation-popup.component";

@Component({
    standalone: true,
    selector: 'post-card',
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.less'],
    imports: [CommonModule, NgbTooltipModule],
})
export class PostComponent implements OnChanges {
    @Input({ required: true }) post: Post = {} as Post;
    @Input() users: DisplayedUser[] = [];
    @Output() onEdit = new EventEmitter<void>();

    authorName: string = 'משתמש מחוק';
    mostPopularComment?: Comment;
    commentCount = 0;
    canEdit = false;
    canDelete = false;

    constructor(
        private readonly authQuery: AuthQuery,
        private readonly modal: NgbModal,
    ){}

    ngOnChanges(changes: SimpleChanges) {
        if (changes['post'] || changes['users']) {
            const author = this.users.find(user => user.id === this.post.authorId);

            if (author) {
                this.authorName = author.display;
            }
        }

        if (changes['post']) {
            const commentsWithPopularity = this.post.comments?.map(comment => ({ ...comment, popularity: this.getSubCommentCount(comment) }));
            const orderedComments = orderBy(commentsWithPopularity ?? [], ['popularity', comment => new Date(comment.publishedAt).valueOf()], ['desc', 'asc']);
            // +1 cause popularity doesn't count itself
            this.commentCount = orderedComments.reduce((sum, com) => sum + 1 + com.popularity, 0);
            this.mostPopularComment = orderedComments[0];

            this.initPermissions();
        }
    }

    private initPermissions(): void {
        const userState = this.authQuery.getValue();
        this.canEdit = userState.id === this.post.authorId;
        this.canDelete = this.canEdit || hasPermissions(userState.role, UserRoles.Admin);
    }

    private getSubCommentCount(comment: Comment, currCount = 0): number {
        if (!comment.children?.length) {
            return currCount;
        }

        return comment.children.length + comment.children.reduce(
            (sum, child) => sum + this.getSubCommentCount(child),
            0
        );
    }

    private async didConfirmAction(popupPrompt: string): Promise<boolean> {
        const modalRef = this.modal.open(ConfirmationPopupComponent);
        const componentInstance: ConfirmationPopupComponent = modalRef.componentInstance;
        componentInstance.body = popupPrompt;
        let result = ConfirmationResult.CANCEL;

        try {
            result = await modalRef.result;
        } catch {
            // user clicked outside the modal to close
        }

        return result === ConfirmationResult.OK;
    }

    openCommentsView(): void {
        alert(`Comments view not yet implemented :(`);
    }

    async deletePost(): Promise<void> {
        if (!await this.didConfirmAction("האם אתם בטוחים שברצונכם למחוק את הפוסט?")) {
            return;
        }

        alert(`Delete post not yet implemented :(`);
    }
}