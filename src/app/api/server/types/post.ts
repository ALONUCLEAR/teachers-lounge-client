/**Technically the @interface ContentEntity here is an @interface ExpandedContentEntity but there's no use for the non expanded ones in the client*/
interface ContentEntity {
    id?: string;
    authorId: string;
    body: string;
    media?: MediaItem[]
    publishedAt: string;
    lastUpdatedAt?: string;
    totalChildrenCount: number;
    children?: Comment[];
}

export interface Post extends ContentEntity {
    title: string,
    subjectId: string,
}

export interface Comment extends ContentEntity {
    parentPostId: string,
    parentId: string,
}

export enum MediaType {
    JPG = "image/jpeg",
    PNG = "image/png",
}

export interface MediaItem {
    data: string;
    type: MediaType;
}