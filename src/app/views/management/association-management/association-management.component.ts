import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { isEqual } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { getAssociationsByType } from 'src/app/api/server/actions/association-actions';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { getAllUsersByStatus } from 'src/app/api/server/actions/user-status-actions';
import { Association, AssociationType } from 'src/app/api/server/types/association';
import { School } from 'src/app/api/server/types/school';
import { DisplayedUser, GenericUser } from 'src/app/api/server/types/user';
import { EntityGroup } from 'src/app/components/ui/list-view/list-view.component';
import { NotificationsService } from 'src/app/services/notifications.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { setFormArray } from 'src/app/utils/form-utils';
import { SchoolSelectionService } from '../../school-selection/school-selection.service';
import { AssociationForm, AssociationManagementService } from './association-management.service';

export interface DisplayedAssociationInfo {
  associatedSchools: School[];
  associatedUsers: DisplayedUser[];
}

@Component({
  selector: 'association-management',
  templateUrl: './association-management.component.html',
  styleUrls: ['./association-management.component.less'],
  providers: [],
})
export class AssociationManagementComponent implements OnInit, OnDestroy {
  private readonly ASSOCIATION_POLLING_RATE_MS = 1000;
  private intervals: number[] = [];

  private schoolId?: string;
  selectedSchoolName: string = '';
  allSchools: School[] = [];
  allUsers: DisplayedUser[] = [];
  allSchoolUsers: DisplayedUser[] = [];
  private schoolAssociations = new BehaviorSubject<Association[]>([]);
  private schoolSubjects = new BehaviorSubject<Association[]>([]);
  selectedAssociationId?: string;
  selectedAssociationInfo: DisplayedAssociationInfo = {
    associatedSchools: [],
    associatedUsers: [],
  };
  associationForm: FormGroup<AssociationForm> = this.associationManagementService.createFilledAssociationForm();

  associationGroups: EntityGroup<Association>[] = [];
  readonly AssociationType = AssociationType;
  isLoading = false;
  readonly pageName = 'ניהול שיוכים ונושאים';

  readonly associationDataMapper = (association: Association) => association.name;
  readonly associationTrackBy = (association?: Association) => association?.id ?? `Association doesn't exist`;
  private readonly userToNameMapper = (user: GenericUser): string => `${user.info.firstName} ${user.info.lastName}(${user.govId})`;

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly notificationService: NotificationsService,
    private readonly authQuery: AuthQuery,
    private readonly associationManagementService: AssociationManagementService,
    private readonly schoolSelectionService: SchoolSelectionService,
  ) { }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    this.schoolId = this.authQuery.getSelectedSchoolId();

    if (!this.schoolId) {
      this.schoolSelectionService.startSchoolSelection(this.pageName);
      return;
    }

    await this.initSchools();
    this.selectedSchoolName = this.allSchools.find(school => school.id === this.schoolId)?.name ?? '';
    await this.initUsers();

    this.pollNormalAssociations();
    this.pollSubjects();

    combineLatest([this.schoolAssociations, this.schoolSubjects])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([associations, subjects]) => {
        this.initAssociationLists(associations, subjects);
      });
  }

  private async initSchools(): Promise<void> {
    try {
      this.allSchools = await getAllSchools();
    } catch (error) {
      console.error(`Error getting schools - `, error);
      this.notificationService.error(`שגיאה בטעינת רשימת בתי ספר`);
    }
  }

  private async initUsers(): Promise<void> {
    try {
      this.allUsers = (await getAllUsersByStatus(this.authQuery.getUserId()!, true))
        .map(user => ({
          ...user,
          display: this.userToNameMapper(user)
        }) as DisplayedUser);
    } catch (error) {
      console.error(`Error getting users - `, error);
      this.notificationService.error(`שגיאה בשליפת המורים בבית הספר`);
    }
  }

  private getAllAssociations(): Association[] {
    return this.associationGroups.flatMap(group => group.entities);
  }

  private getAssociationById(associationId?: string): Association | undefined {
    return associationId ? this.getAllAssociations().find(({ id }) => associationId === id) : undefined;
  }

  private getAssociationSchools(association?: Association): School[] {
    if (!association || !this.allSchools?.length) {
      return [];
    }

    return association.associatedSchools
      .map(schoolId => this.allSchools.find(school => school.id === schoolId))
      .filter(Boolean) as School[]; // I hate the fact that for filter(Boolean) it thinks there could still be an undefined school in the array
  }

  private getAssociationUsers(association?: Association): DisplayedUser[] {
    if (!association || !this.allSchoolUsers?.length) {
      return [];
    }

    return association.associatedUsers
      .map(userId => this.allUsers.find(user => user.id === userId))
      .filter(Boolean) as DisplayedUser[]; // I hate the fact that for filter(Boolean) it thinks there could still be an undefined user in the array
  }

  selectAssociation(associationId?: string): void {
    this.selectedAssociationId = associationId;
    const association = this.getAssociationById(associationId);
    this.allSchoolUsers = this.allUsers.filter(
      user => association?.associatedSchools.some(schoolId => user.associatedSchools.includes(schoolId))
    );
    this.selectedAssociationInfo.associatedSchools = this.getAssociationSchools(association);
    this.selectedAssociationInfo.associatedUsers = this.getAssociationUsers(association);

    this.associationForm = this.associationManagementService.createFilledAssociationForm(association);
  }

  private get isFirstLoad(): boolean {
    return this.isLoading && this.associationGroups.every(group => !group.entities.length);
  }

  private getAsssociationsByType(type: AssociationType): Promise<Association[]> {
    if (!this.schoolId) {
      throw new Error(`Did not select a school`);
    }

    return getAssociationsByType(this.authQuery.getUserId()!, type, this.schoolId);
  }

  private pollNormalAssociations(): void {
    const normalAssociationsInterval = window.setInterval(async () => {
      try {
        const allNormalAssociations = await this.getAsssociationsByType(AssociationType.Normal);

        if (this.isFirstLoad) {
          this.isLoading = false;
        }

        this.schoolAssociations.next(allNormalAssociations);
      } catch (error) {
        console.error(`Error polling associations - `, error);
        this.notificationService.error(
          `לא הצלחנו לשלוף את השייוכים`,
          { title: `שגיאה בשליפת שייוכים` }
        );
      }
    }, this.ASSOCIATION_POLLING_RATE_MS);

    this.intervals.push(normalAssociationsInterval);
  }

  private pollSubjects(): void {
    const subjectsInterval = window.setInterval(async () => {
      try {
        const allSubjects = await this.getAsssociationsByType(AssociationType.Subject);

        if (this.isFirstLoad) {
          this.isLoading = false;
        }

        this.schoolSubjects.next(allSubjects);
      } catch (error) {
        console.error(`Error polling subjects - `, error);
        this.notificationService.error(`לא הצלחנו לשלוף את הנושאים`, {
          title: `שגיאה בשליפת נושאים`,
        });
      }
    }, this.ASSOCIATION_POLLING_RATE_MS);

    this.intervals.push(subjectsInterval);
  }

  private initAssociationLists(
    normalAssociations: Association[],
    subjects: Association[]
  ): void {
    const newAssociationLists = [
      { title: 'שיוכים', entities: normalAssociations },
      { title: 'נושאים', entities: subjects },
    ];

    if (!isEqual(newAssociationLists, this.associationGroups)) {
      this.associationGroups = newAssociationLists;
    }
  }


  setAssociationName(associationName: string): void {
    this.associationForm.controls.name.setValue(associationName);
  }

  setAssociatedSchools(associatedSchools: School[]): void {
    const associatedSchoolIds = associatedSchools.map(({ id }) => id);
    setFormArray(this.associationForm.controls.associatedSchools, associatedSchoolIds);
  }

  setAssociatedUsers(associatedUsers: DisplayedUser[]): void {
    const associatedUserIds = associatedUsers.map(({ id }) => id);
    setFormArray(this.associationForm.controls.associatedUsers, associatedUserIds);
  }

  async onDelete(association: Association): Promise<void> {
    if (await this.associationManagementService.deleteAssociation(association)) {
      this.selectAssociation(undefined);
    }
  }

  async onUpdate(association: Association): Promise<void> {
    this.isLoading = true;

    const oldAssociationName = this.getAssociationById(association.id)?.name;

    if (await this.associationManagementService.upsertAssociation(association, this.associationForm, this.schoolId!, oldAssociationName)) {
      this.selectAssociation(undefined);
    }

    this.isLoading = false;
  }

  async createAssociation(groupTitle: string): Promise<void> {
    const type = groupTitle === this.associationGroups[0].title ? AssociationType.Normal : AssociationType.Subject;

    const didCreationSucceed = await this.associationManagementService.createAssociation(
      this.schoolId!,
      this.allSchools,
      this.allUsers,
      type
    );

    if (didCreationSucceed) {
      this.selectAssociation(undefined);
    }
  }

  private removeAllIntervals(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  ngOnDestroy(): void {
    this.removeAllIntervals();
  }
}