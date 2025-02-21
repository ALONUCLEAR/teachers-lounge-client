import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpStatusCode } from 'axios';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { trySendingMailTo } from 'src/app/api/server/actions/email-actions';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { createUserFromRequest, getAllBlockedUsers, getAllUserRequests, tryDeleteUserRequest, tryUnblockUser } from 'src/app/api/server/actions/user-status-actions';
import { MailInput } from 'src/app/api/server/types/email';
import { School } from 'src/app/api/server/types/school';
import { ApprovableUser } from 'src/app/api/server/types/user';
import { ConfirmationPopupComponent, ConfirmationResult } from 'src/app/components/ui/confirmation-popup/confirmation-popup.component';
import { EntityGroup } from 'src/app/components/ui/list-view/list-view.component';
import { PromptComponent } from 'src/app/components/ui/prompt/prompt.component';
import { NotificationsService } from 'src/app/services/notifications.service';
import { PopupService } from 'src/app/services/popup.service';

@Component({
  selector: 'user-approval',
  templateUrl: './user-approval.component.html',
  styleUrls: ['./user-approval.component.less'],
  providers: [],
})
export class UserApprovalComponent implements OnInit, OnDestroy {
  private readonly USER_POLLING_RATE_MS = 5000;
  private intervals: number[] = [];

  private allSchools: School[] = [];
  private pendingUsers = new BehaviorSubject<ApprovableUser[]>([]);
  private bannedUsers = new BehaviorSubject<ApprovableUser[]>([]);
  selectedUserId?: string;

  approvalGroups: EntityGroup<ApprovableUser>[] = [];
  isLoading = false;

  readonly userDataMapper = (user: ApprovableUser) => `${user.info.firstName} ${user.info.lastName}`;
  readonly userTrackBy = (user1?: ApprovableUser) => user1?.id ?? `User doesn't exist`;
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
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    await this.initSchools();

    this.pollUserRequests();
    this.pollBannedUsers();

    combineLatest([this.pendingUsers, this.bannedUsers])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([pendingUsers, bannedUsers]) => {
        this.initUserLists(pendingUsers, bannedUsers);
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

  private pollUserRequests(): void {
    const userRequestsInterval = window.setInterval(async () => {
      try {
        const allPendingUsers = await getAllUserRequests();
        this.pendingUsers.next(allPendingUsers);
        this.isLoading = false;
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
        const allBannedUsers = await getAllBlockedUsers();
        this.bannedUsers.next(allBannedUsers);
        this.isLoading = false;
      } catch (error) {
        console.error(`Error polling blocked users - `, error);
        this.notificationService.error(`לא הצלחנו לשלוף את המשתמשים החסומים`, {
          title: `שגיאה בשליפת משתמשים`,
        });
      }
    }, this.USER_POLLING_RATE_MS);

    this.intervals.push(bannedUsersInterval);
  }

  private initUserLists(
    pendingUsers: ApprovableUser[],
    bannedUsers: ApprovableUser[]
  ): void {
    this.approvalGroups = [
      { title: 'משתמשים חדשים', entities: pendingUsers },
      { title: 'משתמשים שנחסמו', entities: bannedUsers },
    ];
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

  async onReject(userToReject: ApprovableUser): Promise<void> {
    this.isLoading = true;
    await this.rejectUser(userToReject);
    this.isLoading = false;
  }

  private async rejectUser(userToReject: ApprovableUser): Promise<void> {
    const modalRef = this.modalService.open(PromptComponent);
    const instance: PromptComponent = modalRef.componentInstance;
    instance.answerFieldType = instance.AnswerFieldTypeEnum.TEXTAREA;
    instance.promptTitle = `הודעת דחיה`;
    instance.promptText = `כתבו הסבר למשתמש, שיבין למה בקשתו נדחתה`;

    const rejectionReason = await modalRef.result;

    if (!rejectionReason?.trim()) {
      return;
    }

    const rejectionText = `דחיית הבקשה של ${this.userDataMapper(userToReject)} היא בלתי הפיכה.\n האם להמשיך?`;

    if (!await this.didConfirmAction(rejectionText)) {
      return;
    }

    if (!await tryDeleteUserRequest(userToReject.id)) {
      this.popupService.error(`דחיית הבקשה נכשלה. נסו שוב מאוחר יותר.`, { title: `שגיאה בדחיית בקשה` });

      return;
    }

    const mailInput: MailInput = {
      title: `דחיית בקשה ליצירת משתמש`,
      content: `בקשתך לפתיחת משתמש נדחתה. להלן הסיבה:\n${rejectionReason}`
    };

    if (!await trySendingMailTo(userToReject.email, mailInput)) {
      this.notificationService.error(`לא הצלחנו לשלוח למשתמש את המייל`, { title: `שגיאה בשליחת הודעת דחייה` });
    }
  }

  async onAccept(userToAccept: ApprovableUser): Promise<void> {
    this.isLoading = true;
    await this.acceptUser(userToAccept);
    this.isLoading = false;
  }

  private async acceptUser(userToAccept: ApprovableUser): Promise<void> {
    const isNewUser = userToAccept?.role;
    const actionName = isNewUser ? 'תאשר' : 'תשחזר';
    const userDetails = `${this.userDataMapper(userToAccept)}(${userToAccept.govId})`;
    const popupText = `הפעולה ${actionName} את המשתמש ${userDetails}.\n האם להמשיך?`;

    if (!await this.didConfirmAction(popupText)) {
      return;
    }

    if (isNewUser) {
      await this.createUser(userToAccept.id);
    } else {
      await this.unblockUser(userToAccept.id);
    }
  }

  private async createUser(requestId: string): Promise<void> {
    const responseStatus = await createUserFromRequest(requestId);

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
    if (!await tryUnblockUser(userId)) {
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