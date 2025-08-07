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
  @Input() processed!: Set<string>;
  @Input() userIdToDisplayName = new Map<string, string>();
  @Input() postSchools: string[] = [];

  /**Emits the array of indecies to get to it since just assigning comment = newValue would override the reference as well */
  @Output() onExpand = new EventEmitter<number[]>();
  @Output() onReply = new EventEmitter<Comment>();
  @Output() onEdit = new EventEmitter<[Comment, Comment?]>();
  @Output() onDelete = new EventEmitter<string>();

  authorName = 'משתמש מחוק';
  isExpanded = false;
  isProcessing = false;

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

    if (changes['processed'] || changes['comment']) {
      this.isProcessing = this.processed.has(this.comment.id!);
    }
  }

  emitExpand(indecies: number[], newIndex?: number): void {
    if (newIndex !== undefined) {
      this.onExpand.emit([newIndex, ...indecies]);
    } else {
      this.isProcessing = true;
      this.onExpand.emit([...indecies]);
    }
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
    this.onReply.emit(this.comment);
  }

  emitEdit(previousEvent?: [Comment, Comment?]): void {
    if (!previousEvent) {
      // the comment we want to edit
      this.onEdit.emit([this.comment]);
    } else if (!previousEvent[1]) {
      // the parent comment
      this.onEdit.emit([previousEvent[0], this.comment]);
    } else {
      this.onEdit.emit(previousEvent);
    }
  }

  handleDeleteClick(): void {
    this.onDelete.emit(this.comment.id!);
  }
}
