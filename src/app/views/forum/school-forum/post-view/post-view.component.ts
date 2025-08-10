import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep, isEqual, keyBy } from 'lodash';
import { distinctUntilChanged, first, map } from 'rxjs';
import { getAssociationById } from 'src/app/api/server/actions/association-actions';
import { getCommentById, tryDeleteComment, tryUpsertComment } from 'src/app/api/server/actions/comment-actions';
import { getPostById } from 'src/app/api/server/actions/post-actions';
import { hasPermissions, UserRoles } from 'src/app/api/server/types/permissions';
import { Comment, Post } from 'src/app/api/server/types/post';
import { DisplayedUser } from 'src/app/api/server/types/user';
import { ConfirmationService } from 'src/app/services/confirmation.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { UserQuery } from 'src/app/stores/user/user.query';
import { PostService } from '../post.service';
import { Association } from 'src/app/api/server/types/association';

@Component({
    selector: 'post-view',
    templateUrl: './post-view.component.html',
    styleUrls: ['./post-view.component.less']
})
export class PostViewComponent implements OnInit {
    postId!: string;
    post!: Post;
    comments: Comment[] = [];
    expanded = new Set<string>();
    processedComments = new Set<string>();
    replyParentId?: string;
    repliedUserName?: string;
    editingComment?: Comment;
    newCommentBody: string = '';
    userIdToDisplayName = new Map<string, string>();
    readonly defaultUserName = 'משתמש מחוק';
    authorName = this.defaultUserName;
    subject!: Association;
    postSchools: string[] = [];

    isProcessing = false;
    canEdit = false;
    canDelete = false;

    constructor(
        private readonly authQuery: AuthQuery,
        private readonly notificationsService: NotificationsService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly userQuery: UserQuery,
        private readonly destroyRef: DestroyRef,
        private readonly confirmationService: ConfirmationService,
        private readonly postService: PostService,
    ) { }

    async ngOnInit(): Promise<void> {
        const postId = this.route.snapshot.paramMap.get('postId');

        if (!postId) {
            this.redirect();
            return;
        }

        this.postId = postId;
        await this.fetchPostData();
        this.initPermissions();
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

                if (!subject) {
                    this.redirect();
                }

                this.subject = subject;
                this.postSchools = subject.associatedSchools ?? [];
            } catch {}
        }
    }

    private initPermissions(): void {
        const userState = this.authQuery.getValue();

        const canView = userState.associatedSchools.some(schoolId => this.postSchools.includes(schoolId));

        if (!canView) {
            this.redirect();
            return;
        }

        this.canEdit = this.post.authorId === userState.id;
        this.canDelete = this.canEdit || hasPermissions(userState.role, UserRoles.Admin);
    }

    initNewComment(): void {
        this.newCommentBody = '';
        this.replyParentId = undefined;
        this.repliedUserName = undefined;
        this.editingComment = undefined;
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

    private getComment(indexChain: number[]): Comment {
        let comment = this.comments[indexChain[0]];

        for (let index = 1; index < indexChain.length; index++) {
            comment = comment.children![indexChain[index]];
        }

        return comment;
    }

    private setComment(indexChain: number[], newComment: Comment): void {
        if (indexChain.length < 1) {
            return;
        }

        if (indexChain.length < 2) {
            this.comments[indexChain[0]] = newComment;
            return;
        }

        const lastIndexInChain = indexChain[indexChain.length - 1];
        let parentComment = this.comments[indexChain[0]];

        for (let index = 0; index < indexChain.length - 2; index++) {
            parentComment = parentComment.children![indexChain[index]];
        }

        parentComment.children![lastIndexInChain] = newComment;
    }

    async editPost(): Promise<void> {
        this.isProcessing = true;

        if(await this.postService.openPostForm(this.subject, this.post)) {
            await this.fetchPostData();
            this.initNewComment();
        }

        this.isProcessing = false;
    }

    async deletePost(): Promise<void> {
        this.isProcessing = true;

        if (await this.postService.deletePost(this.post.id!)) {
            // no post to read anymore
            this.redirect();
        }

        this.isProcessing = false;
    }

    async toggleCommentExpanding(firstCommentIndex: number, indexChain: number[]): Promise<void> {
        const fullCommentChain = [firstCommentIndex, ...indexChain];
        const comment = this.getComment(fullCommentChain);

        if (!comment?.id || comment.totalChildrenCount < 1) {
            return;
        }

        this.processedComments.add(comment.id);
        this.processedComments = new Set(this.processedComments);
        
        if (!comment.children?.length) {
            const expandedComment = await getCommentById(this.authQuery.getUserId()!, comment.id);
            this.setComment(fullCommentChain, expandedComment ?? comment);
        }

        if (!this.expanded.has(comment.id)) {
            this.expanded.add(comment.id);
            this.expanded = new Set(this.expanded);
        } else {
            this.expanded.delete(comment.id);
            this.expanded = new Set(this.expanded);
        }

        this.processedComments.delete(comment.id);
        this.processedComments = new Set(this.processedComments);
    }

    async submitComment(): Promise<void> {
        this.isProcessing = true;

        if (!this.newCommentBody.trim()) {
            this.notificationsService.warn(`לא ניתן להגיב תגובה ריקה`, { position: 'bottom left' });
            this.newCommentBody="";
        } else {
            await this.upsertComment(this.newCommentBody);
        }

        this.isProcessing = false;
    }

    private async upsertComment(body: string): Promise<boolean> {
        const userId = this.authQuery.getUserId()!;
        const serializedComment: Comment = this.editingComment
        ? {
            ...this.editingComment,
            body,
            lastUpdatedAt: new Date().toISOString(),
        }
        : {
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

        await this.refreshComments(serializedComment.parentId, serializedComment.parentPostId);

        this.notificationsService.success(`התגובה נשמרה בהצלחה`);

        if (!this.editingComment) {
            this.post.totalChildrenCount++;
        }

        this.initNewComment();
        return true;
    }

    private refreshComments(parentId: string, postId: string): Promise<void> {        
        if (parentId === postId) {
            // direct child of the post
            return this.refreshTopLevelComments();
        }

        return this.refreshCommentTree(parentId);
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
                    const newTotal = comments[i].children?.reduce((acc, curr) => acc + curr.totalChildrenCount + 1, 0) ?? 0;
                    comments[i].totalChildrenCount = newTotal;

                    return true;
                }
            }
            return false;
        };

        updateTree(this.comments);
    }

    setReplyParent(comment?: Comment): void {
        this.replyParentId = comment?.id;
        this.repliedUserName = comment ? this.userIdToDisplayName.get(comment.authorId) : undefined;
        
        if (this.editingComment) {
            this.editingComment = undefined;
            this.newCommentBody = '';
        }
    }

    setEditingComment([comment, parent]: [Comment, Comment?]): void {
        this.setReplyParent(parent);
        this.editingComment = comment;
        this.newCommentBody = comment.body;
    }

    async deleteComment(comment: Comment): Promise<void> {
        const dontDeletePrompt = `האם ברצונך למחוק את התגובה? גם כל תגובות הבן שלה(אם יש כאלו) ימחקו!`;
        if (!await this.confirmationService.didConfirmAction(dontDeletePrompt)) {
            return;
        }

        if (!await tryDeleteComment(this.authQuery.getUserId()!, comment.id!)) {
            this.notificationsService.error(`מחיקת תגובה נכשלה`);
            return;
        }

        await this.refreshComments(comment.parentId, comment.parentPostId);

        this.notificationsService.success(`התגובה נמחקה בהצלחה`);
        this.post.totalChildrenCount -= (1 + comment.totalChildrenCount);

        this.initNewComment();
    }
}
