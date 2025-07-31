import { CommonModule } from "@angular/common";
import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Post, Comment } from "src/app/api/server/types/post";
import { DisplayedUser } from 'src/app/api/server/types/user';
import { orderBy } from 'lodash';

@Component({
    standalone: true,
    selector: 'post-card',
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.less'],
    imports: [CommonModule],
})
export class PostComponent implements OnChanges {
    @Input({ required: true }) post: Post = {} as Post;
    @Input() users: DisplayedUser[] = [];

    authorName: string = 'משתמש מחוק';
    mostPopularComment?: Comment;
    commentCount = 0;

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
        }
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
}