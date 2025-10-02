import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivityStatus, DisplayedStatus, DisplayedUser, getHebrewwActivityStatus, User } from 'src/app/api/server/types/user';
import { ConfirmationPopupComponent, ConfirmationResult } from 'src/app/components/ui/confirmation-popup/confirmation-popup.component';
import {
  ActionType,
  ActionIcon,
  FieldType,
  PropertyField,
  InputAction,
} from 'src/app/components/ui/my-table/my-table.components';
import { NotificationsService } from 'src/app/services/notifications.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { SchoolSelectionService } from '../../school-selection/school-selection.service';
import { createUserFromRequest, getAllUsersByStatus, getUsersBySchool, tryDeleteUserRequest, tryUnlinkUserFromSchool } from 'src/app/api/server/actions/user-actions';
import { getAllSchools, getSchoolById } from 'src/app/api/server/actions/school-actions';
import { PromptComponent } from 'src/app/components/ui/prompt/prompt.component';
import { MailInput } from 'src/app/api/server/types/email';
import { trySendingMailTo } from 'src/app/api/server/actions/email-actions';
import { PopupService } from 'src/app/services/popup.service';
import { HttpStatusCode } from 'axios';
import { SchoolLinkingPopupComponent } from './school-linking-popup/school-linking-popup.component';
import { uniqBy } from 'lodash';
import { ConfirmationService } from 'src/app/services/confirmation.service';
import { ActivatedRoute } from '@angular/router';

export const getUserFullName = ({ info: { firstName, lastName } }: Pick<User, 'info'>) => `${firstName} ${lastName}`;
const getUserFullInfo = (user: Pick<User, 'govId' | 'info'>) => `${getUserFullName(user)}(${user.govId})`;

@Component({
  selector: 'teacher-management',
  templateUrl: './teacher-management.component.html',
  styleUrls: ['./teacher-management.component.less'],
  providers: [AuthQuery],
})
export class TeacherManagementComponent implements OnInit, OnDestroy {
  readonly fields: PropertyField<User>[] = [
    {
      type: FieldType.READONLY,
      title: 'תעודת זהות',
      mapper: (user) => user.govId,
    },
    {
      type: FieldType.READONLY,
      title: 'שם מלא',
      mapper: getUserFullName,
    },
    {
      type: FieldType.READONLY,
      title: 'מספר בתי ספר מקושרים',
      mapper: (user) => `${user?.associatedSchools?.length ?? 0}`,
    },
    {
      type: FieldType.READONLY,
      title: 'סטטוס משתמש',
      mapper: user => getHebrewwActivityStatus(user.activityStatus)
    },
  ];

  readonly PAGE_NAME = "ניהול מורים";
  deleteIcon = ActionIcon.UNLINK;

  additionalActions: InputAction[] = [];

  isLoading = false;
  private schoolId?: string;
  schoolName: string = '';
  private users: User[] = [];
  filteredUsers: User[] = [];

  private intervals: number[] = [];
  nameorGoveIdFilter = '';
  statusFilter = getHebrewwActivityStatus(ActivityStatus.Active);
  statuses: DisplayedStatus[] = [ActivityStatus.Active, ActivityStatus.Pending].map(status => ({
    name: getHebrewwActivityStatus(status),
    value: status,
  }));
  defaultStatus = this.statuses[0];
  resetVar = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly schoolSelectionService: SchoolSelectionService,
    private readonly notificationsService: NotificationsService,
    private readonly modalService: NgbModal,
    private readonly popupService: PopupService,
    private readonly authQuery: AuthQuery,
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    this.schoolId = await this.schoolSelectionService.getSelectedSchoolId(this.PAGE_NAME);

    if (!this.schoolId) {
      return;
    }

    this.schoolName = (await getSchoolById(this.schoolId))!.name;

    this.fetchUsers();

    const shouldSwitchToPending = this.route.snapshot.queryParamMap.get('pending') ?? "false";

    console.log({shouldSwitchToPending, params: this.route.snapshot.queryParamMap.keys});

    if (shouldSwitchToPending == "true") {
      this.defaultStatus = this.statuses[1];
      this.changeActivityStatusFilter(this.defaultStatus);
      this.resetVar = (this.resetVar + 1) % 2;
    }
  }

  setUsers(users: User[]): void {
    this.users = users;
    this.filterUsers();
  }

  private async getAndSetUsers(): Promise<void> {
    // get and set users in school
    if (!this.schoolId) {
      this.notificationsService.error(`לא נבחר בית ספר`);
      return;
    }

    const allUsersInSchool = await getUsersBySchool(this.authQuery.getUserId()!, this.schoolId, true);
    this.setUsers(allUsersInSchool);

    // finished fetching so it's loading mah boy
    this.isLoading = false;
  }

  private fetchUsers(): void {
    this.getAndSetUsers();
    const interval = window.setInterval(() => this.getAndSetUsers(), 5000);
    this.intervals.push(interval);
  }

  private removeAllIntervals(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  async handleAction({ action, entity }: { action: ActionType; entity?: User }): Promise<void> {
    switch (action) {
      case ActionType.DELETE:
        if (entity?.activityStatus === ActivityStatus.Pending) {
          await this.rejectUser(entity);
        } else {
          await this.unlinkUser(entity);
        }
        break;
      case ActionType.APPROVE_USER:
        await this.approveUser(entity!);
        break;
      case ActionType.SAVE:
        if (this.statusFilter === this.statuses[1].name) {
          this.clearFilters();
        }
        await this.linkTeachersToSchool();
        break;
      default:
        this.notificationsService.warn(`פעולה לא תקינה`);
        break;
    }
  }

  private async approveUser(userRequest: User): Promise<void> {
      const responseStatus = await createUserFromRequest(this.authQuery.getUserId()!, userRequest.id);
  
      if (responseStatus >= HttpStatusCode.MultipleChoices) {
        this.popupService.error("שגיאה ביצירת משתמש");
      } else if (responseStatus > HttpStatusCode.Ok) {
        this.notificationsService.warn("משתמש נוצר בהצלחה, אך מחיקת הבקשה נכשלה");
      } else {
        await this.notificationsService.success("משתמש נוצר בהצלחה");
      }

      this.setUsers(this.users.filter(({ id }) => id !== userRequest.id));
    }

  private async rejectUser(userRequest: User): Promise<void> {
    const modalRef = this.modalService.open(PromptComponent);
    const instance: PromptComponent = modalRef.componentInstance;
    instance.answerFieldType = instance.AnswerFieldTypeEnum.TEXTAREA;
    instance.promptTitle = `הודעת דחיה`;
    instance.promptText = `כתבו הסבר למשתמש, שיבין למה בקשתו נדחתה`;

    const rejectionReason = await modalRef.result;

    if (!rejectionReason?.trim()) {
      return;
    }

    const username = getUserFullName(userRequest);
    const rejectionText = `דחיית הבקשה של ${username} היא בלתי הפיכה.\n האם להמשיך?`;

    if (!await ConfirmationService.didConfirmAction(this.modalService, rejectionText)) {
      return;
    }

    if (!await tryDeleteUserRequest(this.authQuery.getUserId()!, userRequest.id)) {
      this.popupService.error(`דחיית הבקשה נכשלה. נסו שוב מאוחר יותר.`, { title: `שגיאה בדחיית בקשה` });

      return;
    } else {
      this.notificationsService.success(`הבקשה של ${username} נדחתה`, { title: `פעולה הושלמה בהצלחה`});
    }

    const mailInput: MailInput = {
      title: `דחיית בקשה ליצירת משתמש`,
      content: `בקשתך לפתיחת משתמש נדחתה. להלן הסיבה:\n${rejectionReason}`,
    };

    if (!await trySendingMailTo(this.authQuery.getUserId()!, userRequest.email, mailInput)) {
      this.notificationsService.error(`לא הצלחנו לשלוח למשתמש את המייל`, { title: `שגיאה בשליחת הודעת דחייה` });
    }

    this.setUsers(this.users.filter(({ id }) => id !== userRequest.id));
  }

  async unlinkUser(user?: User): Promise<void> {
    if (!user) {
      this.notificationsService.error(`לא נבחר מורה לניתוק`);

      return;
    }

    const userName = getUserFullName(user);
    const confirmationBody = `אתם בטוחים שברצונכם לבצע את הניתוק? לא ישארו ל${userName} שום בתי ספר מקושרים!`;

    if (user.associatedSchools.length === 1 && !await ConfirmationService.didConfirmAction(this.modalService, confirmationBody)) {
      return;
    }

    if (!await tryUnlinkUserFromSchool(this.authQuery.getUserId()!, user.id, this.schoolId!)) {
      this.notificationsService.error('אופס... משהו השתבש', {
        title: `שגיאה בניתוק ${userName} מבית הספר`,
      });
      return;
    }

    this.notificationsService.success(userName + " נותק/ה מבית הספר בהצלחה");
    await this.getAndSetUsers();

    this.setUsers(this.users.filter(({ id }) => id !== user.id));
  }

  async linkTeachersToSchool(): Promise<void> {
    const allActiveUsers = (await getAllUsersByStatus(this.authQuery.getUserId()!, true))
      .map(user => ({...user, display: getUserFullInfo(user), role: user.role!}));

    const modalRef = this.modalService.open(SchoolLinkingPopupComponent);
    const componentInstance: SchoolLinkingPopupComponent = modalRef.componentInstance;
    componentInstance.currentSchoolId = this.schoolId!;
    componentInstance.allUsers = allActiveUsers;
    let linkedUsers: DisplayedUser[]  = [];

    try {
      linkedUsers = (await modalRef.result) ?? [];
    } catch {
      // user clicked outside the modal to close
    }

    if (linkedUsers.length) {
      this.notificationsService.success(`המשתמשים קושרו בהצלחה`);
      this.setUsers(uniqBy([...this.users, ...linkedUsers], 'id'));
    }
  }

  filterUsers(): void {
    const passNameOrGovIdFilter = (user: User) =>
      !this.nameorGoveIdFilter.trim() || (getUserFullInfo(user)).includes(this.nameorGoveIdFilter.trim());
    const passActivityStatusFilter = (user: User) => this.statusFilter === getHebrewwActivityStatus(user.activityStatus);

    this.filteredUsers = this.users.filter(
      user => passActivityStatusFilter(user) && passNameOrGovIdFilter(user)
    );
  }

  changeNameOrGovIdFilter(name: string): void {
    this.nameorGoveIdFilter = name ?? "";
    this.filterUsers();
  }

  changeActivityStatusFilter({ name, value }: DisplayedStatus): void {
    console.trace(name, value);
    this.statusFilter = name;

    if (value === ActivityStatus.Pending) {
      this.additionalActions = [{ action: ActionType.APPROVE_USER, icon: ActionIcon.APPROVE_USER }];
      this.deleteIcon = ActionIcon.REJECT_USER;
    } else {
      this.additionalActions = [];
      this.deleteIcon = ActionIcon.UNLINK;
    }

    this.filterUsers();
  }

  clearFilters(): void {
    this.changeNameOrGovIdFilter("");
    this.changeActivityStatusFilter(this.statuses[0]);
    this.resetVar = (this.resetVar + 1) % 2;
  }

  ngOnDestroy(): void {
    this.removeAllIntervals();
  }
}