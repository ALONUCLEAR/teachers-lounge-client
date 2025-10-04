import { Component, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isEqual, partition } from 'lodash';
import { distinctUntilChanged } from 'rxjs';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { tryChangeUserRole } from 'src/app/api/server/actions/user-actions';
import { hasPermissions, UserRoles } from 'src/app/api/server/types/permissions';
import { School } from 'src/app/api/server/types/school';
import { User } from 'src/app/api/server/types/user';
import { EntityGroup } from 'src/app/components/ui/list-view/list-view.component';
import { ConfirmationService } from 'src/app/services/confirmation.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { PopupService } from 'src/app/services/popup.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { UserQuery } from 'src/app/stores/user/user.query';
import { getUserFullName } from '../teacher-management/teacher-management.component';
import { UserSchoolLinkingPopupComponent } from './user-school-linking-popup/user-school-linking-popup.component';

@Component({
  selector: 'super-admin-management',
  templateUrl: './super-admin-management.component.html',
  styleUrls: ['./super-admin-management.component.less'],
})
export class SuperAdminManagementComponent implements OnInit {
  readonly PAGE_NAME = "ניהול בכירים";

  private allSchools: School[] = [];

  selectedUserId?: string;
  private allUsers: User[] = [];
  userGroups: EntityGroup<User>[] = [];

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
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    await this.initSchools();

    this.userQuery.selectAll({
      filterBy: user => !hasPermissions(user.role, UserRoles.Support)
    }).pipe(
      distinctUntilChanged((a, b) => isEqual(a, b)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(allUsers => {
      this.initUserLists(allUsers);
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
    allUsers: User[]
  ): void {
    this.allUsers = allUsers;
    const [ superAdmins, nonSuperAdmins ] = partition(allUsers, user => hasPermissions(user.role, UserRoles.SuperAdmin));

    this.userGroups = [
      { title: 'בכירים', entities: superAdmins },
      { title: 'מנהלים ומורים', entities: nonSuperAdmins },
    ];

    this.isLoading = false;
  }

  async onRoleChange(user: User, targetRole: UserRoles): Promise<void> {
    this.isLoading = true;

    if (hasPermissions(user.role, targetRole)) {
      await this.demoteUser(user, targetRole);
    } else {
      await this.promoteUser(user, targetRole);
    }

    this.isLoading = false;
  }

  async linkSchoolsToUser(selectedUser: User): Promise<string[]> {
      const modalRef = this.modalService.open(UserSchoolLinkingPopupComponent);
      const componentInstance: UserSchoolLinkingPopupComponent = modalRef.componentInstance;
      componentInstance.currentUser = selectedUser;
      componentInstance.allSchools = this.allSchools;
      let linkedSchoolIds: string[]  = [];
  
      try {
        linkedSchoolIds = (await modalRef.result) ?? [];
      } catch {
        // user clicked outside the modal to close
      }
  
      if (linkedSchoolIds.length) {
        this.notificationsService.success(`המשתמשים קושרו בהצלחה`);
      }

      return linkedSchoolIds;
    }
  
  
  private async demoteUser(userToDemote: User, targetRole: UserRoles): Promise<void> {
    const userDetails = `${this.userDataMapper(userToDemote)}(${userToDemote.govId})`;
    const popupText = `הפעולה תשנמך את ההרשאות של ${userDetails} ל${targetRole}.\n האם להמשיך?`;

    if (!await ConfirmationService.didConfirmAction(this.modalService, popupText)) {
      return;
    }

    const selectedSchoolIds = await this.linkSchoolsToUser(userToDemote);
    
    if (!selectedSchoolIds.length) {
      return;
    }

    if (!await tryChangeUserRole(this.authQuery.getUserId()!, userToDemote.id, targetRole, 'demote')) {
      this.popupService.error(`לא הצלחנו לשנמך את ${userDetails} להרשאת ${targetRole}`, { title: "שגיאה בשנמוך משתמש"});
      return;
    }
    
    this.popupService.success(`ההרשאה של ${userDetails} שונתה ל${targetRole}`, { title: "הרשאה שונתה בהצלחה"});
    
    const optimisticTeachersAndAdmins = this.allUsers
      .map(teacher => teacher.id === userToDemote.id
        ? ({ ...teacher, role: targetRole, associatedSchools: selectedSchoolIds })
        : teacher
      );
    this.initUserLists(optimisticTeachersAndAdmins); 
  }

  private async promoteUser(userToPromote: User, targetRole: UserRoles): Promise<void> {
    const userDetails = `${this.userDataMapper(userToPromote)}(${userToPromote.govId})`;
    const popupText = `הפעולה תקדם את ההרשאות של ${userDetails} ל${targetRole}.\n האם להמשיך?`;

    if (!await ConfirmationService.didConfirmAction(this.modalService, popupText)) {
      return;
    }

    if (!await tryChangeUserRole(this.authQuery.getUserId()!, userToPromote.id, targetRole, 'promote')) {
      this.popupService.error(`לא הצלחנו לקדם את ${userDetails} להרשאת ${targetRole}`, { title: "שגיאה בקידום משתמש"});
      return;
    }
    
    this.popupService.success(`ההרשאה של ${userDetails} שונתה ל${targetRole}`, { title: "הרשאה שונתה בהצלחה"});
    const optimisticTeachersAndAdmins = this.allUsers
      .map(teacher => teacher.id === userToPromote.id
        ? ({ ...teacher, role: targetRole })
          : teacher
        );
    this.initUserLists(optimisticTeachersAndAdmins); 
  }
}