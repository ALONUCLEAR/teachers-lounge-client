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
export type Comment = {
    id?: string,
    body: string,
    publishedAt: string,
    children: Comment[]
}

const subjectIds = ['67c35d23fa0176a64cd89d87', '687a5472051d8bdcdcfadb29', '687a5822051d8bdcdcfadb2b'];
const userId = '678ace37b90278999414aeb5';
const eyalId = "67b8633dfa31a99dd9b3c831";

export const mockPosts: Post[] = [
    {
        id: '1',
        title: 'פוסט ראשון',
        subjectId: subjectIds[0],
        authorId: userId,
        body: 'זה הפוסט הראשון שלי\nהנה ירידת שורה',
        publishedAt: new Date('11 SEP 2001').toISOString(),
        comments: [
            { id: 'c1', body: 'זוהי תגובה', publishedAt: new Date('11 SEP 2001 09:11').toISOString(), children: [] },
            {
                id: 'c2', body: 'זוהי עוד תגובה', publishedAt: new Date('12 SEP 2001 7:30').toISOString(),
                children: [
                    { id: 'c21', body: 'one more', publishedAt: '', children: [] },
                    { id: 'c22', body: 'two more', publishedAt: '', children: [] },
                ]
            },
            {
                id: 'c3', body: 'זוהי עוד עוד תגובה', publishedAt: new Date('13 SEP 2001 1:30').toISOString(),
                children: [
                    {
                        id: 'c31', body: 'one more', publishedAt: '',
                        children: [{
                            id: 'c311', body: 'one more', publishedAt: '',
                            children: [{ id: 'c3111', body: 'one more', publishedAt: '', children: []}]
                        }]
                    }
                ]
            },
        ]
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
        title: 'פוסט שלישי חשוב',
        subjectId: subjectIds[0],
        authorId: eyalId,
        body: 'זה הפוסט השלישי שלי\tהנה טאב',
        publishedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
    }
]