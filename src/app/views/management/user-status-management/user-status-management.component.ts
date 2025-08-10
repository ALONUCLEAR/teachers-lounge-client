import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpStatusCode } from 'axios';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { trySendingMailTo } from 'src/app/api/server/actions/email-actions';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { createUserFromRequest, getAllUsersByStatus, getAllUserRequests, tryDeleteUserRequest, tryUnblockUser, tryBlockUser } from 'src/app/api/server/actions/user-actions';
import { MailInput } from 'src/app/api/server/types/email';
import { School } from 'src/app/api/server/types/school';
import { ActivityStatus, GenericUser } from 'src/app/api/server/types/user';
import { ConfirmationPopupComponent, ConfirmationResult } from 'src/app/components/ui/confirmation-popup/confirmation-popup.component';
import { EntityGroup } from 'src/app/components/ui/list-view/list-view.component';
import { PromptComponent } from 'src/app/components/ui/prompt/prompt.component';
import { ConfirmationService } from 'src/app/services/confirmation.service';
import { NotificationsService } from 'src/app/services/notifications.service';
import { PopupService } from 'src/app/services/popup.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { AuthStore } from 'src/app/stores/auth/auth.store';

@Component({
  selector: 'user-status-management',
  templateUrl: './user-status-management.component.html',
  styleUrls: ['./user-status-management.component.less'],
})
export class UserStatusManagementComponent implements OnInit, OnDestroy {
  private readonly USER_POLLING_RATE_MS = 5000;
  private intervals: number[] = [];

  private allSchools: School[] = [];
  private pendingUsers = new BehaviorSubject<GenericUser[]>([]);
  private bannedUsers = new BehaviorSubject<GenericUser[]>([]);
  private activeUsers = new BehaviorSubject<GenericUser[]>([]);
  selectedUserId?: string;

  approvalGroups: EntityGroup<GenericUser>[] = [];
  readonly ActivityStatus = ActivityStatus;
  isLoading = false;

  readonly userDataMapper = (user: GenericUser) => `${user.info.firstName} ${user.info.lastName}`;
  readonly userTrackBy = (user1?: GenericUser) => user1?.id ?? `User doesn't exist`;
  readonly idToSchoolMapper = (schoolIds: string[]): string[] => {
    return this.allSchools
      .filter((school) => schoolIds.includes(school.id))
      .map((school) => school.name);
  };
  readonly joinStrings = (list: string[]): string => list.join(', ');

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly modalService: NgbModal,
    private readonly notificationService: NotificationsService,
    private readonly popupService: PopupService,
    private readonly authQuery: AuthQuery,
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    await this.initSchools();

    this.pollUserRequests();
    this.pollBannedUsers();
    this.pollActiveUsers();

    combineLatest([this.pendingUsers, this.bannedUsers, this.activeUsers])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([pendingUsers, bannedUsers, activeUsers]) => {
        this.initUserLists(pendingUsers, bannedUsers, activeUsers);
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

  selectUser(userId?: string): void {
    this.selectedUserId = userId;
  }

  private get isFirstLoad(): boolean {
    return this.isLoading && this.approvalGroups.every(group => !group.entities.length);
  }

  private pollUserRequests(): void {
    const userRequestsInterval = window.setInterval(async () => {
      try {
        const allPendingUsers = await getAllUserRequests(this.authQuery.getUserId()!);
        
        if (this.isFirstLoad) {
          this.isLoading = false;
        }

        this.pendingUsers.next(allPendingUsers);
      } catch (error) {
        console.error(`Error polling user requests - `, error);
        this.notificationService.error(
          `לא הצלחנו לשלוף את המשתמשים החדשים שממתינים לאישור`,
          { title: `שגיאה בשליפת משתמשים` }
        );
      }
    }, this.USER_POLLING_RATE_MS);

    this.intervals.push(userRequestsInterval);
  }

  private pollBannedUsers(): void {
    const bannedUsersInterval = window.setInterval(async () => {
      try {
        const allBannedUsers = await getAllUsersByStatus(this.authQuery.getUserId()!, false);

        if (this.isFirstLoad) {
          this.isLoading = false;
        }

        this.bannedUsers.next(allBannedUsers);
      } catch (error) {
        console.error(`Error polling blocked users - `, error);
        this.notificationService.error(`לא הצלחנו לשלוף את המשתמשים החסומים`, {
          title: `שגיאה בשליפת משתמשים`,
        });
      }
    }, this.USER_POLLING_RATE_MS);

    this.intervals.push(bannedUsersInterval);
  }

  private pollActiveUsers(): void {
    const activeUsersInterval = window.setInterval(async () => {
      try {
        const allActiveUsers = await getAllUsersByStatus(this.authQuery.getUserId()!, true);

        if (this.isFirstLoad) {
          this.isLoading = false;
        }

        this.activeUsers.next(allActiveUsers);
      } catch (error) {
        console.error(`Error polling active users - `, error);
        this.notificationService.error(`לא הצלחנו לשלוף את המשתמשים הפעילים`, {
          title: `שגיאה בשליפת משתמשים`,
        });
      }
    }, this.USER_POLLING_RATE_MS);

    this.intervals.push(activeUsersInterval);
  }

  private initUserLists(
    pendingUsers: GenericUser[],
    bannedUsers: GenericUser[],
    activeUsers: GenericUser[],
  ): void {
    this.approvalGroups = [
      { title: 'משתמשים חדשים', entities: pendingUsers },
      { title: 'משתמשים שנחסמו', entities: bannedUsers },
      { title: 'משתמשים פעילים', entities: activeUsers }
    ];
  }

  async onReject(userToReject: GenericUser): Promise<void> {
    this.isLoading = true;
    await this.rejectUser(userToReject);
    this.isLoading = false;
  }

  async onBlock(userToBlock: GenericUser): Promise<void> {
    this.isLoading = true;
    await this.rejectUser(userToBlock, true);
    this.isLoading = false;
  }

  private async rejectUser(userToReject: GenericUser, isBlocking = false): Promise<void> {
    const modalRef = this.modalService.open(PromptComponent);
    const instance: PromptComponent = modalRef.componentInstance;
    instance.answerFieldType = instance.AnswerFieldTypeEnum.TEXTAREA;
    instance.promptTitle = `הודעת ${isBlocking ? 'חסימה' : 'דחיה'}`;
    instance.promptText = `כתבו הסבר למשתמש, שיבין למה ${isBlocking ? 'נחסם' : 'בקשתו נדחתה'}`;

    const rejectionReason = await modalRef.result;

    if (!rejectionReason?.trim()) {
      return;
    }

    const rejectionText = isBlocking
      ? `הפעולה תחסום את ${this.userDataMapper(userToReject)}.\n האם להמשיך?`
      : `דחיית הבקשה של ${this.userDataMapper(userToReject)} היא בלתי הפיכה.\n האם להמשיך?`;

    if (!await ConfirmationService.didConfirmAction(this.modalService, rejectionText)) {
      return;
    }

    if (!isBlocking && !await tryDeleteUserRequest(this.authQuery.getUserId()!, userToReject.id)) {
      this.popupService.error(`דחיית הבקשה נכשלה. נסו שוב מאוחר יותר.`, { title: `שגיאה בדחיית בקשה` });

      return;
    } else if(isBlocking && !await tryBlockUser(this.authQuery.getUserId()!, userToReject.id)) {
      this.popupService.error(`החסימה נכשלה. נסו שוב מאוחר יותר.`, { title: 'שגיאה בחסימת משתמש' });

      return;
    }

    this.selectUser(undefined);

    const mailInput: MailInput = isBlocking
      ? {
          title: 'חסימת משתמש',
          content: `המשתמש שלך נחסם. להלן הסיבה\n${rejectionReason}`,
        }
      : {
          title: `דחיית בקשה ליצירת משתמש`,
          content: `בקשתך לפתיחת משתמש נדחתה. להלן הסיבה:\n${rejectionReason}`,
        };

    if (!await trySendingMailTo(userToReject.email, mailInput)) {
      this.notificationService.error(`לא הצלחנו לשלוח למשתמש את המייל`, { title: `שגיאה בשליחת הודעת ${isBlocking ? 'חסימה': 'דחייה'}` });
    }
  }

  async onAccept(userToAccept: GenericUser): Promise<void> {
    this.isLoading = true;
    await this.acceptUser(userToAccept);
    this.isLoading = false;
  }

  private async acceptUser(userToAccept: GenericUser): Promise<void> {
    const isNewUser = userToAccept.activityStatus === ActivityStatus.Pending;
    const actionName = isNewUser ? 'תאשר' : 'תשחזר';
    const userDetails = `${this.userDataMapper(userToAccept)}(${userToAccept.govId})`;
    const popupText = `הפעולה ${actionName} את המשתמש ${userDetails}.\n האם להמשיך?`;

    if (!await ConfirmationService.didConfirmAction(this.modalService, popupText)) {
      return;
    }

    if (isNewUser) {
      await this.createUser(userToAccept.id);
    } else {
      await this.unblockUser(userToAccept.id);
    }
  }

  private async createUser(requestId: string): Promise<void> {
    const responseStatus = await createUserFromRequest(this.authQuery.getUserId()!, requestId);

    if (responseStatus >= HttpStatusCode.MultipleChoices) {
      this.popupService.error("שגיאה ביצירת משתמש");
    } else if (responseStatus > HttpStatusCode.Ok) {
      this.popupService.warn("משתמש נוצר בהצלחה, אך מחיקת הבקשה נכשלה");
    } else {
      await this.popupService.success("משתמש נוצר בהצלחה");
      this.selectUser(undefined);
    }
  }

  private async unblockUser(userId: string): Promise<void> {
    if (!await tryUnblockUser(this.authQuery.getUserId()!, userId)) {
      this.popupService.error("שגיאה בשחזור משתמש");
    } else {
      await this.popupService.success("משתמש שוחזר בהצלחה");
      this.selectUser(undefined);
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