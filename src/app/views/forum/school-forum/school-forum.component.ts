import { Component } from '@angular/core';
import { SchoolSelectionService } from '../../school-selection/school-selection.service';
import { getSchoolById } from 'src/app/api/server/actions/school-actions';
import { Association, AssociationType } from 'src/app/api/server/types/association';
import { getAssociationsByType } from 'src/app/api/server/actions/association-actions';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { UserRoles } from 'src/app/api/server/types/permissions';
import { mockPosts, Post } from 'src/app/api/server/types/post';
import { groupBy, orderBy } from 'lodash';

@Component({
    selector: 'school-forum',
    templateUrl: './school-forum.component.html',
    styleUrls: ['./school-forum.component.less']
})
export class SchoolForumComponent {
    readonly PAGE_NAME = "פורום";
    isLoading = false;
    selectedSchoolId?: string;
    selectedSchoolName: string = '';
    subjects: Association[] = [];
    associations: Association[] = [];
    activeSubjectId = '';
    noSubjectsInstructions = '';
    postsBySubject: Record<string, Post[]> = {};

    constructor(
        private readonly schoolSelectionService: SchoolSelectionService,
        private readonly authQuery: AuthQuery,
    ) { }

    async ngOnInit(): Promise<void> {
        this.isLoading = true;

        this.selectedSchoolId = this.schoolSelectionService.getSelectedSchoolId(this.PAGE_NAME);

        if (!this.selectedSchoolId) {
            return;
        }

        this.selectedSchoolName = (await getSchoolById(this.selectedSchoolId))!.name;
        const userId = this.authQuery.getUserId()!;

        this.subjects = await getAssociationsByType(userId, AssociationType.Subject, this.selectedSchoolId);
        this.associations = await getAssociationsByType(userId, AssociationType.Normal, this.selectedSchoolId);
        this.activeSubjectId = this.subjects[0]?.id ?? '';
        this.noSubjectsInstructions = this.authQuery.getValue().role === UserRoles.Base
            ? 'נא בקש/י ממנהל/ת בבית הספר ליצור נושא כדי להשמיש את הפורום.'
            : 'על מנת להשמיש את הפורום יש ליצור נושא חדש במסך "ניהול שיוכים ונושאים".';

        const allPostsInSchool = mockPosts;
        this.postsBySubject = groupBy(orderBy(allPostsInSchool, ['publishedAt', 'title'], ['desc', 'asc']), 'subjectId');

        this.isLoading = false;
    }
}
