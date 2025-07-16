import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isEqual } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { getAssociationsByType, tryDeleteAssociation, tryUpsertAssociation } from 'src/app/api/server/actions/assiciation-actions';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { getAllUsersByStatus, getUsersBySchool } from 'src/app/api/server/actions/user-status-actions';
import { Association, AssociationType, getAssociationTypeKey } from 'src/app/api/server/types/association';
import { School } from 'src/app/api/server/types/school';
import { DisplayedUser, GenericUser, User } from 'src/app/api/server/types/user';
import { ConfirmationPopupComponent, ConfirmationResult } from 'src/app/components/ui/confirmation-popup/confirmation-popup.component';
import { EntityGroup } from 'src/app/components/ui/list-view/list-view.component';
import { NotificationsService } from 'src/app/services/notifications.service';
import { PopupService } from 'src/app/services/popup.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { setFormArray } from 'src/app/utils/form-utils';

interface AssociationForm {
  name: FormControl<string>;
  associatedSchools: FormArray<FormControl<string>>;
  associatedUsers: FormArray<FormControl<string>>;
}

interface DisplayedAssociationInfo {
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
  associationForm: FormGroup<AssociationForm> = this.createAssociationForm();

  associationGroups: EntityGroup<Association>[] = [];
  readonly AssociationType = AssociationType;
  isLoading = false;

  readonly associationDataMapper = (association: Association) => association.name;
  readonly associationTrackBy = (association?: Association) => association?.id ?? `Association doesn't exist`;
  private readonly userToNameMapper = (user: GenericUser): string => `${user.info.firstName} ${user.info.lastName}(${user.govId})`;

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly modalService: NgbModal,
    private readonly notificationService: NotificationsService,
    private readonly popupService: PopupService,
    private readonly authQuery: AuthQuery,
    private readonly formBuilder: FormBuilder,
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    // TODO: add a selection screen
    this.schoolId = "67178a86f7ae796d39447ae6" //?? this.authQuery.getValue()?.associatedSchools?.[0];
    await this.initSchools();
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

  private createAssociationForm(association?: Association): FormGroup<AssociationForm> {
    const associatedSchools = association?.associatedSchools?.filter(Boolean) ?? [];
    const associatedSchoolControls = associatedSchools.map(schoolId => this.formBuilder.control(schoolId, { nonNullable: true }));
    const associatedUsers = association?.associatedUsers?.filter(Boolean) ?? [];
    const associatedUserControls = associatedUsers.map(userId => this.formBuilder.control(userId, { nonNullable: true }));

    return this.formBuilder.group<AssociationForm>({
      name: this.formBuilder.control<string>(association?.name || '', { nonNullable: true, validators: [Validators.required] }),
      associatedSchools: this.formBuilder.array(associatedSchoolControls, { validators: [Validators.required, Validators.minLength(1)] }),
      associatedUsers: this.formBuilder.array(associatedUserControls, { validators: [Validators.required] }),
    });
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

    this.associationForm = this.createAssociationForm(association);
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

  private async didConfirmAction(popupPrompt: string): Promise<boolean> {
    const modalRef = this.modalService.open(ConfirmationPopupComponent);
    const componentInstance: ConfirmationPopupComponent = modalRef.componentInstance;
    componentInstance.body = popupPrompt;
    let result = ConfirmationResult.CANCEL;

    try {
      result = await modalRef.result;
    } catch {
      // user clicked outside the modal to close
    }

    return result === ConfirmationResult.OK;
  }

  private getTypename(association: Association): string {
    return association.type === AssociationType.Subject ? 'נושא' : 'שיוך';
  }

  private serializeForm(type: AssociationType): Association {
    return {
      id: this.selectedAssociationId,
      name: this.associationForm.value.name!,
      associatedSchools: this.associationForm.value.associatedSchools!,
      associatedUsers: this.associationForm.value.associatedUsers ?? [],
      // We turn it into a string that would't be a real AssociationType but thankfully in typescript types are suggestions
      // And the value we're turning it into is really a valid value when it comes to the server
      type: getAssociationTypeKey(type) as AssociationType,
    };
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
    this.isLoading = true;
    await this.deleteAssociation(association);
    this.isLoading = false;
  }

  private async deleteAssociation(association: Association): Promise<void> {
    if (!association?.id) {
      return;
    }

    const confirmationPrompt = `לחיצה על אישור תמחק את ה${this.getTypename(association)}`;

    if (!this.didConfirmAction(confirmationPrompt)) {
      return;
    }

    const actionName = `מחיקת ה${this.getTypename(association)}`;

    if (await tryDeleteAssociation(this.authQuery.getUserId()!, association.id)) {
      this.popupService.success(`${actionName} הושלמה בהצלחה`);
      this.selectAssociation(undefined);
    } else {
      this.popupService.error(`${actionName} נכשלה. אנא נסו שוב במועד מאוחר יותר.`);
    }
  }

  async onUpsert(association: Association): Promise<void> {
    this.isLoading = true;
    await this.upsertAssociation(association);
    this.isLoading = false;
  }

  // TODO: need to actually add a button to create an association
  private async upsertAssociation(association: Association): Promise<void> {
    const actionName = `${association.id ? 'עדכון' : 'יצירת'} ${association.type}`;

    if (!this.associationForm.valid) {
      this.popupService.error(`שדות לא תקינים`, { title: `נסיון ${actionName} נכשל` });
      return;
    }

    if (await tryUpsertAssociation(this.authQuery.getUserId()!, this.serializeForm(association.type))) {
      this.popupService.success(`פעולת ${actionName} הסתיימה בהצלחה`);
      this.selectAssociation(undefined);
    } else {
      this.popupService.error(`שגיאה ב${actionName}`);
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