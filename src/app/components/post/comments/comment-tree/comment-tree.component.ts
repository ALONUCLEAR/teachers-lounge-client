import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { hasPermissions, UserRoles } from 'src/app/api/server/types/permissions';
import { Comment } from 'src/app/api/server/types/post';
import { AuthQuery } from 'src/app/stores/auth/auth.query';

@Component({
  standalone: true,
  selector: 'comment-tree',
  templateUrl: './comment-tree.component.html',
  styleUrls: ['./comment-tree.component.less'],
  imports: [CommonModule, DatePipe]
})
export class CommentTreeComponent implements OnChanges {
  @Input() comment!: Comment;
  @Input() expanded!: Set<string>;
  @Input() userIdToDisplayName = new Map<string, string>();
  @Input() postSchools: string[] = [];

  @Output() onExpand = new EventEmitter<void>();
  @Output() onReply = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<void>();

  authorName = 'משתמש מחוק';
  isExpanded = false;

  canEdit = false;
  canDelete = false;

  constructor(private readonly authQuery: AuthQuery){}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userIdToDisplayName'] || changes['comment']) {
      const authorName = this.userIdToDisplayName.get(this.comment.authorId);
      if (authorName) this.authorName = authorName;
    }

    if (changes['expanded'] || changes['comment']) {
        this.isExpanded = this.expanded.has(this.comment.id!);
    }

    if (changes['comment'] || changes['postSchools']) {
        this.initPermissions();
    }
  }

  // TODO: figure out why it doesn't close
  handleExpandClick(): void {
    this.onExpand.emit();
  }

  initPermissions(): void {
    const user = this.authQuery.getValue();
    this.canEdit = this.comment.authorId === user.id;
    this.canDelete = this.canEdit
        || (
            hasPermissions(user.role,  UserRoles.Admin)
            && user.associatedSchools.some(schoolId => this.postSchools.includes(schoolId))
        );
}

  handleReplyClick(): void {
    this.onReply.emit();
  }

  handleEditClick(): void {
    this.onEdit.emit();
  }

  handleDeleteClick(): void {
    this.onDelete.emit();
  }
}
