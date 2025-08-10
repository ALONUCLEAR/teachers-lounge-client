import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Router } from "@angular/router";
import { NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { hasPermissions, UserRoles } from "src/app/api/server/types/permissions";
import { Comment, Post } from "src/app/api/server/types/post";
import { DisplayedUser } from 'src/app/api/server/types/user';
import { AuthQuery } from "src/app/stores/auth/auth.query";

@Component({
    standalone: true,
    selector: 'post-card',
    templateUrl: './post-card.component.html',
    styleUrls: ['./post-card.component.less'],
    imports: [CommonModule, NgbTooltipModule],
})
export class PostCardComponent implements OnChanges {
    @Input({ required: true }) post: Post = {} as Post;
    @Input() users: DisplayedUser[] = [];
    @Output() onEdit = new EventEmitter<void>();
    @Output() onDelete = new EventEmitter<void>();

    authorName: string = 'משתמש מחוק';
    canEdit = false;
    canDelete = false;

    mostPopularComment?: Comment & { authorName: string };

    constructor(
        private readonly authQuery: AuthQuery,
        private readonly router: Router,
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['post'] || changes['users']) {
            this.authorName = this.getAuthorName(this.post);
        }

        if (changes['post']) {
            this.initPermissions();
            this.mostPopularComment = this.getMostPopularComment(this.post);
        }
    }

    private getAuthorName(content: Pick<Post, 'authorId'>): string {
        const author = this.users.find(user => user.id === content.authorId);
        
        return author?.display ?? 'משתמש מחוק';
    }

    private initPermissions(): void {
        const userState = this.authQuery.getValue();
        this.canEdit = userState.id === this.post.authorId;
        this.canDelete = this.canEdit || hasPermissions(userState.role, UserRoles.Admin);
    }

    private getMostPopularComment(post: Post): Comment & { authorName: string } | undefined {
        const mostPopularComment = (post.children ?? []).sort((a, b) => b.totalChildrenCount - a.totalChildrenCount)?.[0];
        const authorName = this.getAuthorName(mostPopularComment);

        return mostPopularComment ? { ...mostPopularComment, authorName } : undefined;
    }

    openPostView(): void {
        this.router.navigate([`posts/${this.post.id!}`]);
    }
}