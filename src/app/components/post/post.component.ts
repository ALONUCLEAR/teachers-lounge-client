import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { Post } from "src/app/api/server/types/post";

@Component({
    standalone: true,
    selector: 'post-card',
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.less'],
    imports: [CommonModule],
})
export class PostComponent {
    @Input({ required: true }) post: Post = {} as Post;
}