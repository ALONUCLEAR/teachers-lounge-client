import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { groupBy, orderBy } from 'lodash';
import { getAssociationsByType } from 'src/app/api/server/actions/association-actions';
import { getPostsBySubjects } from 'src/app/api/server/actions/post-actions';
import { getSchoolById } from 'src/app/api/server/actions/school-actions';
import { Association, AssociationType } from 'src/app/api/server/types/association';
import { UserRoles } from 'src/app/api/server/types/permissions';
import { Post } from 'src/app/api/server/types/post';
import { DisplayedUser } from 'src/app/api/server/types/user';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { UserQuery } from 'src/app/stores/user/user.query';
import { SchoolSelectionService } from '../../school-selection/school-selection.service';
import { PostService } from './post.service';

@Component({
    selector: 'school-forum',
    templateUrl: './school-forum.component.html',
    styleUrls: ['./school-forum.component.less']
})
export class SchoolForumComponent implements OnInit {
    readonly PAGE_NAME = "פורום";
    isLoading = false;
    selectedSchoolId?: string;
    selectedSchoolName: string = '';
    subjects: Association[] = [];
    associations: Association[] = [];
    users: DisplayedUser[] = [];
    activeSubjectId = '';
    noSubjectsInstructions = '';
    postsBySubject: Record<string, Post[]> = {};
    postsToDisplay: Post[] = [];

    authorIdFilter?: string;
    textFilter?: string;

    constructor(
        private readonly schoolSelectionService: SchoolSelectionService,
        private readonly authQuery: AuthQuery,
        private readonly userQuery: UserQuery,
        private readonly destroyRef: DestroyRef,
        private readonly postService: PostService,
    ) { }

    async ngOnInit(): Promise<void> {
        this.isLoading = true;

        this.selectedSchoolId = await this.schoolSelectionService.getSelectedSchoolId(this.PAGE_NAME);

        if (!this.selectedSchoolId) {
            return;
        }

        this.selectedSchoolName = (await getSchoolById(this.selectedSchoolId))!.name;
        const userState = this.authQuery.getValue();
        const userId = userState.id;

        this.userQuery.selectAllBySchool(this.selectedSchoolId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(users => this.users = users.map(user => ({...user, display: `${user.info.firstName} ${user.info.lastName}(${user.govId})`})));

        this.subjects = await getAssociationsByType(userId, AssociationType.Subject, this.selectedSchoolId);
        this.associations = await getAssociationsByType(userId, AssociationType.Normal, this.selectedSchoolId);
        this.activeSubjectId = this.subjects.find(({ id }) => id)?.id ?? '';
        this.noSubjectsInstructions = userState.role === UserRoles.Base
            ? 'נא בקש/י ממנהל/ת בבית הספר ליצור נושא כדי להשמיש את הפורום.'
            : 'על מנת להשמיש את הפורום יש ליצור נושא חדש במסך "ניהול שיוכים ונושאים".';

        await this.fetchPosts();

        this.isLoading = false;
    }

    private async fetchPosts(): Promise<void> {
        const userId = this.authQuery.getUserId()!;
        const subjectIds = this.subjects.map(({ id }) => id!).filter(Boolean);
        const allPostsInSchool = await getPostsBySubjects(userId, subjectIds);
        this.postsBySubject = groupBy(orderBy(allPostsInSchool, ['publishedAt', 'title'], ['desc', 'asc']), 'subjectId');
        this.initFilters();
    }

    private initFilters(): void {
        this.authorIdFilter = undefined;
        this.textFilter = undefined;
        this.filterPosts();
    }

    changeTab(subjectId: string): void {
        this.activeSubjectId = subjectId;
        this.filterPosts();
    }

    updateAuthorFilter(user?: DisplayedUser): void {
        this.authorIdFilter = user?.id;
        this.filterPosts();
    }

    updateTextFilter(text?: string) {
        this.textFilter = text || undefined;// treat empty string as undefined
        this.filterPosts();
    }

    private filterPosts(): void {
        const passesAuthorFilter = (post: Post): boolean => !this.authorIdFilter || post.authorId === this.authorIdFilter;
        const passesTextFilter = (post: Post): boolean => !this.textFilter || post.body.includes(this.textFilter) || post.title.includes(this.textFilter);
        
        this.postsToDisplay = this.postsBySubject[this.activeSubjectId]
            ?.filter(post => passesAuthorFilter(post) && passesTextFilter(post))
            ?? [];
    }

    async openPostForm(post?: Post): Promise<void> {
        const subject = this.subjects.find(subject => subject.id === this.activeSubjectId);

        if (await this.postService.openPostForm(subject!, post)) {
            // post was saved
            await this.fetchPosts();
        }
    }

    async deletePost(postId: string): Promise<void> {
        if (await this.postService.deletePost(postId)) {
            this.fetchPosts();
        }
    }
}
