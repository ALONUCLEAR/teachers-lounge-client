import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { isEqual, keyBy } from 'lodash';
import { distinctUntilChanged, map } from 'rxjs';
import { getAssociationById } from 'src/app/api/server/actions/association-actions';
import { getCommentById, tryUpsertComment } from 'src/app/api/server/actions/comment-actions';
import { getPostById } from 'src/app/api/server/actions/post-actions';
import { Comment, Post } from 'src/app/api/server/types/post';
import { DisplayedUser } from 'src/app/api/server/types/user';
import { NotificationsService } from 'src/app/services/notifications.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { UserQuery } from 'src/app/stores/user/user.query';

@Component({
    selector: 'post-view',
    templateUrl: './post-view.component.html',
    styleUrls: ['./post-view.component.less']
})
export class PostViewComponent implements OnInit {
    postId!: string;
    post!: Post;
    comments: Comment[] = [];
    expanded: Set<string> = new Set();
    replyParentId: string | null = null;
    newCommentBody: string = '';
    userIdToDisplayName = new Map<string, string>();
    readonly defaultUserName = 'משתמש מחוק';
    authorName = this.defaultUserName;
    postSchools: string[] = [];

    constructor(
        private readonly authQuery: AuthQuery,
        private readonly notificationsService: NotificationsService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly userQuery: UserQuery,
        private readonly destroyRef: DestroyRef,
    ) { }

    async ngOnInit(): Promise<void> {
        const postId = this.route.snapshot.paramMap.get('postId');

        if (!postId) {
            this.redirect();
            return;
        }

        this.postId = postId;
        await this.fetchPostData();
        this.initUserList();
        this.initNewComment();
    }

    private redirect(): void {
        this.router.navigate(['/forum']);
    }

    private async fetchPostData(): Promise<void> {
        if (this.postId) {
            let post: Post | undefined;
            const userId = this.authQuery.getUserId()!;

            try {
                post = await getPostById(userId, this.postId);
            } catch {}
            
            if (!post) {
                this.redirect();
                return;
            }
            
            this.post = post;
            this.comments = this.post?.children ?? [];

            try {
                const subject = await getAssociationById(userId, post?.subjectId);
                this.postSchools = subject?.associatedSchools ?? [];
            } catch {}
        }
    }

    private initNewComment(): void {
        this.newCommentBody = '';
        this.replyParentId = null;
    }

    private initUserList(): void {
        this.userQuery.selectAllDisplayed()
            .pipe(
                map(users => new Map(users.map(user => [user.id, user.display]))),
                distinctUntilChanged((a, b) => isEqual(a, b)),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(usersMap => {
                this.userIdToDisplayName = usersMap;
                const authorName = this.userIdToDisplayName.get(this.post.authorId);

                if (authorName) {
                    this.authorName = authorName;
                }
            })
    }

    async toggleCommentExpanding(commentIndex: number): Promise<void> {
        const comment: Comment = this.comments[commentIndex];
        if (!comment?.id || comment.totalChildrenCount < 1) {
            return;
        }

        if (!comment.children?.length) {
            const expandedComment = await getCommentById(this.authQuery.getUserId()!, comment.id);
            this.comments[commentIndex] = expandedComment ?? comment;
        }

        if (!this.expanded.has(comment.id)) {
            this.expanded.add(comment.id);
        } else {
            this.expanded.delete(comment.id);
        }
    }

    async submitComment(): Promise<void> {
        await this.upsertComment(this.newCommentBody);
    }

    private async upsertComment(body: string): Promise<boolean> {
        const userId = this.authQuery.getUserId()!;
        const serializedComment: Comment = {
            authorId: userId,
            body,
            parentId: this.replyParentId ?? this.postId,
            parentPostId: this.postId,
            publishedAt: new Date().toISOString(),
            totalChildrenCount: 0,
        }

        if (!await tryUpsertComment(userId, serializedComment)) {
            this.notificationsService.error(`שמירת תגובה נכשלה`);
            return false;
        }

        this.notificationsService.success(`התגובה נשמרה בהצלחה`);
        this.post.totalChildrenCount++;

        if (!this.replyParentId) {
            // direct child of the post
            this.refreshTopLevelComments();
        } else {
            this.refreshCommentTree(this.replyParentId);
        }

        this.initNewComment();
        return true;
    }


    private async refreshTopLevelComments(): Promise<void> {
        const updatedPost = await getPostById(this.authQuery.getUserId()!, this.postId);
        if (!updatedPost) return;

        // Preserve old expanded state & nested comment trees
        const previousComments = this.comments;
        const updatedComments = updatedPost.children ?? [];

        for (let i = 0; i < updatedComments.length; i++) {
            const updated = updatedComments[i];
            const match = previousComments.find(prev => prev.id === updated.id);
            if (match && this.expanded.has(match.id!)) {
                updatedComments[i] = match; // retain old nested structure
            }
        }

        this.comments = updatedComments;
    }


    private async refreshCommentTree(parentId: string): Promise<void> {
        const updatedComment = await getCommentById(this.authQuery.getUserId()!, parentId);
        if (!updatedComment) return;

        const updateTree = (comments: Comment[]): boolean => {
            for (let i = 0; i < comments.length; i++) {
                if (comments[i].id === parentId) {
                    comments[i] = updatedComment;
                    return true;
                }

                if (comments[i].children && updateTree(comments[i].children!)) {
                    return true;
                }
            }
            return false;
        };

        updateTree(this.comments);
    }


    setReplyParent(commentId: string): void {
        this.replyParentId = commentId;
    }

    cancelReply(): void {
        this.replyParentId = null;
    }
}
