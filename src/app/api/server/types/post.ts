export interface Post {
    id?: string,
    title: string,
    subjectId: string,
    authorId: string,
    body: string,
    // media: Media[],
    publishedAt: string,
    lastUpdatedAt?: string,
    totalChildrenCount: number,
    mostPopularComment?: Comment,
}

// TODO: add more when we actually care, move it to a separate file for consistancy
export type Comment = {
    id?: string,
    body: string,
    publishedAt: string,
    children: Comment[]
}