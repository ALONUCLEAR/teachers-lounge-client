import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { hasPermissions, UserRoles } from "src/app/api/server/types/permissions";
import { Post } from "src/app/api/server/types/post";
import { DisplayedUser } from 'src/app/api/server/types/user';
import { AuthQuery } from "src/app/stores/auth/auth.query";

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
    @Output() onDelete = new EventEmitter<void>();

    authorName: string = 'משתמש מחוק';
    canEdit = false;
    canDelete = false;

    constructor(private readonly authQuery: AuthQuery) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['post'] || changes['users']) {
            const author = this.users.find(user => user.id === this.post.authorId);

            if (author) {
                this.authorName = author.display;
            }
        }

        if (changes['post']) {
            this.initPermissions();
        }
    }

    private initPermissions(): void {
        const userState = this.authQuery.getValue();
        this.canEdit = userState.id === this.post.authorId;
        this.canDelete = this.canEdit || hasPermissions(userState.role, UserRoles.Admin);
    }

    openCommentsView(): void {
        alert(`Comments view not yet implemented :(`);
    }
}