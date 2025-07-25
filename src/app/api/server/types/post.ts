export interface Post {
    id?: string,
    title: string,
    subjectId: string,
    authorId: string,
    /**A list of the associations ids, which would need to be broken down and handled on the server side */
    importantParticipants?: string[],
    body: string,
    // media: Media[],
    publishedAt: string,
    lastUpdatedAt?: string,
    comments?: Comment[],
}

// TODO: add more when we actually care, move it to a separate file for consistancy
type Comment = {
    id?: string,
}

const subjectIds = ['67c35d23fa0176a64cd89d87', '687a5472051d8bdcdcfadb29', '687a5822051d8bdcdcfadb2b'];
const userId = '678ace37b90278999414aeb5';

export const mockPosts: Post[] = [
    {
        id: '1',
        title: 'פוסט ראשון',
        subjectId: subjectIds[0],
        authorId: userId,
        body: 'זה הפוסט הראשון שלי\nהנה ירידת שורה',
        publishedAt: new Date('11 SEP 2001').toISOString(),
    },
    {
        id: '2',
        title: 'פוסט שני',
        subjectId: subjectIds[1],
        authorId: userId,
        body: 'זה הפוסט השני שלי\vהנה תו מיוחד אחר',
        publishedAt: new Date('6 JAN 2020').toISOString(),
    },
    {
        id: '3',
        title: 'פוסט שלישי',
        subjectId: subjectIds[0],
        authorId: userId,
        body: 'זה הפוסט השלישי שלי\tהנה טאב',
        publishedAt: new Date().toISOString(),
    }
]