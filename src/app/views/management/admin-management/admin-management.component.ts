import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpStatusCode } from 'axios';
import { groupBy, isEqual } from 'lodash';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { createUserFromRequest, tryChangeUserRole, tryLinkUsersToSchool, tryUnblockUser, tryUnlinkUserFromSchool } from 'src/app/api/server/actions/user-actions';
import { hasPermissions, UserRoles } from 'src/app/api/server/types/permissions';
import { School } from 'src/app/api/server/types/school';
import { ActivityStatus, User } from 'src/app/api/server/types/user';
import { EntityGroup } from 'src/app/components/ui/list-view/list-view.component';
import { ConfirmationService } from 'src/app/services/confirmation.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { PopupService } from 'src/app/services/popup.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { UserQuery } from 'src/app/stores/user/user.query';
import { SchoolSelectionService } from '../../school-selection/school-selection.service';
import { getUserFullName } from '../teacher-management/teacher-management.component';
import { BehaviorSubject, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'admin-management',
  templateUrl: './admin-management.component.html',
  styleUrls: ['./admin-management.component.less'],
})
export class AdminManagementComponent implements OnInit {
  readonly PAGE_NAME = "ניהול מנהלים בבית ספר";
  schoolId?: string;
  selectedSchoolName: string = '';

  private allSchools: School[] = [];

  selectedUserId?: string;
  private allTeachersAndAdmins: User[] = [];
  allTeachersAndAdminsGroups: EntityGroup<User>[] = [];

  isLoading = false;

  readonly userDataMapper = (user: User) => getUserFullName(user);
  readonly userTrackBy = (user1?: User) => user1?.id ?? `User doesn't exist`;
  readonly idToSchoolMapper = (schoolIds: string[]): string[] => {
    return this.allSchools
      .filter((school) => schoolIds.includes(school.id))
      .map((school) => school.name);
  };
  readonly joinStrings = (list: string[]): string => list.join(', ');
  readonly UserRoles = UserRoles;

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly modalService: NgbModal,
    private readonly notificationsService: NotificationsService,
    private readonly popupService: PopupService,
    private readonly authQuery: AuthQuery,
    private readonly userQuery: UserQuery,
    private readonly schoolSelectionService: SchoolSelectionService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    this.schoolId = await this.schoolSelectionService.getSelectedSchoolId(this.PAGE_NAME);

    if (!this.schoolId) {
      return;
    }

    await this.initSchools();
    this.selectedSchoolName = this.allSchools.find(school => school.id === this.schoolId)?.name ?? '';

    this.userQuery.selectAll({
      filterBy: user => !hasPermissions(user.role, UserRoles.SuperAdmin)
    }).pipe(
      distinctUntilChanged((a, b) => isEqual(a, b)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(allTeachersAndAdmins => {
      this.initUserLists(allTeachersAndAdmins);
    });
  }

  private async initSchools(): Promise<void> {
    try {
      this.allSchools = await getAllSchools();
    } catch (error) {
      console.error(`Error getting schools - `, error);
      this.notificationsService.error(`שגיאה בטעינת רשימת בתי ספר`);
    }
  }

  selectUser(userId?: string): void {
    this.selectedUserId = userId;
  }

  private initUserLists(
    allTeachersAndAdmins: User[]
  ): void {
    this.allTeachersAndAdmins = allTeachersAndAdmins;
    const userGroups = groupBy(allTeachersAndAdmins, user => user.associatedSchools.includes(this.schoolId!)
      ? hasPermissions(user.role, UserRoles.Admin)
        ? 1
        : 0
      : 2
    );

    const [teachersInSchool, adminsInSchool, usersOutsideOfSchool] = [0, 1, 2].map(key => userGroups[key] ?? []);

    this.allTeachersAndAdminsGroups = [
      { title: 'מורים', entities: teachersInSchool },
      { title: 'מנהלים', entities: adminsInSchool },
      { title: 'לא מקושרים לביה"ס', entities: usersOutsideOfSchool }
    ];

    this.isLoading = false;
  }

  async onUnlink(userToReject: User): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    await this.unlinkUser(userToReject);
    this.isLoading = false;
  }

  async unlinkUser(user?: User): Promise<void> {
    if (!user) {
      this.notificationsService.error(`לא נבחר מורה לניתוק`);

      return;
    }

    const userName = this.userDataMapper(user);
    const confirmationBody = `אתם בטוחים שברצונכם לבצע את הניתוק? לא ישארו ל${userName} שום בתי ספר מקושרים!`;

    if (user.associatedSchools.length === 1 && !await ConfirmationService.didConfirmAction(this.modalService, confirmationBody)) {
      return;
    }

    if (!await tryUnlinkUserFromSchool(this.authQuery.getUserId()!, user.id, this.schoolId!)) {
      this.notificationsService.error('אופס... משהו השתבש', {
        title: `שגיאה בניתוק ${userName} מבית הספר`,
      });
    } else {
      this.notificationsService.success(userName + " נותק/ה מבית הספר בהצלחה");
    }

    const optimisticTeachersAndAdmins = this.allTeachersAndAdmins
      .map(teacher => teacher.id === user.id
        ? ({ ...teacher, associatedSchools: teacher.associatedSchools.filter(id => id !== this.schoolId) })
          : teacher
        );
    this.initUserLists(optimisticTeachersAndAdmins);
  }

  async onLink(userToLink: User): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    await this.linkUser(userToLink);
    this.isLoading = false;
  }
  
  async linkUser(user?: User): Promise<void> {
    if (!user) {
      this.notificationsService.error(`לא נבחר מורה לקישור`);

      return;
    }

    const userName = this.userDataMapper(user);

    if (!await tryLinkUsersToSchool(this.authQuery.getUserId()!, [user.id], this.schoolId!)) {
      this.notificationsService.error('אופס... משהו השתבש', {
        title: `שגיאה בקישור ${userName} לבית הספר`,
      });
    } else {
      this.notificationsService.success(userName + " קושר/ה לבית הספר בהצלחה");
    }

    const optimisticTeachersAndAdmins = this.allTeachersAndAdmins
      .map(teacher => teacher.id === user.id
        ? ({ ...teacher, associatedSchools: [...teacher.associatedSchools, this.schoolId!] })
        : teacher
      );
    this.initUserLists(optimisticTeachersAndAdmins);
  }

  async onRoleChange(user: User): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    if (hasPermissions(user.role, UserRoles.Admin)) {
      await this.demoteUser(user);
    } else {
      await this.promoteUser(user);
    }

    this.isLoading = false;
  }

  
  private async demoteUser(userToDemote: User): Promise<void> {
    const userDetails = `${this.userDataMapper(userToDemote)}(${userToDemote.govId})`;
    const targetRole = UserRoles.Base;
    const popupText = `הפעולה תשנמך את ההרשאות של ${userDetails} ל${targetRole}.\n האם להמשיך?`;

    if (!await ConfirmationService.didConfirmAction(this.modalService, popupText)) {
      return;
    }

    if (!await tryChangeUserRole(this.authQuery.getUserId()!, userToDemote.id, targetRole, 'demote')) {
      this.popupService.error(`לא הצלחנו לשנמך את ${userDetails} להרשאת ${targetRole}`, { title: "שגיאה בשנמוך משתמש"});
      return;
    }
    
    this.popupService.success(`ההרשאה של ${userDetails} שונתה ל${targetRole}`, { title: "הרשאה שונתה בהצלחה"});
    
    const optimisticTeachersAndAdmins = this.allTeachersAndAdmins
      .map(teacher => teacher.id === userToDemote.id
        ? ({ ...teacher, role: targetRole })
          : teacher
        );
    this.initUserLists(optimisticTeachersAndAdmins); 
  }

  private async promoteUser(userToPromote: User): Promise<void> {
    const userDetails = `${this.userDataMapper(userToPromote)}(${userToPromote.govId})`;
    const targetRole = UserRoles.Admin;
    const popupText = `הפעולה תקדם את ההרשאות של ${userDetails} ל${targetRole}.\n האם להמשיך?`;

    if (!await ConfirmationService.didConfirmAction(this.modalService, popupText)) {
      return;
    }

    if (!await tryChangeUserRole(this.authQuery.getUserId()!, userToPromote.id, targetRole, 'promote')) {
      this.popupService.error(`לא הצלחנו לקדם את ${userDetails} להרשאת ${targetRole}`, { title: "שגיאה בקידום משתמש"});
      return;
    }
    
    this.popupService.success(`ההרשאה של ${userDetails} שונתה ל${targetRole}`, { title: "הרשאה שונתה בהצלחה"});
    const optimisticTeachersAndAdmins = this.allTeachersAndAdmins
      .map(teacher => teacher.id === userToPromote.id
        ? ({ ...teacher, role: targetRole })
          : teacher
        );
    this.initUserLists(optimisticTeachersAndAdmins); 
  }
}