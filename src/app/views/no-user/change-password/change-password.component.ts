import { AfterViewInit, Component, DestroyRef, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { buffer, debounceTime, filter, firstValueFrom, fromEvent, map, throttleTime } from 'rxjs';
import { isCodeVerified, trySendingCodeToUserByGovId } from 'src/app/api/server/actions/email-actions';
import { trySendingForgotPasswordRequest } from 'src/app/api/server/actions/user-actions';
import { PasswordInputComponent } from 'src/app/components/ui/password-input/password-input.component';
import { PromptComponent } from 'src/app/components/ui/prompt/prompt.component';
import { PopupService } from 'src/app/services/popup.service';
import { PASSWORD_PATTERN } from '../sign-up/sign-up.component';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.less'],
})
export class ChangePasswordComponent implements AfterViewInit, OnInit {
  readonly PASSWORD_PATTERN = PASSWORD_PATTERN;
  private readonly IMAGE_NAMES = ["teachers at noon.jpeg", "teachers at night.jpeg"];

  @ViewChild('forgotPasswordPage') formElement?: ElementRef;
  @ViewChild('repeatPassword') repeatPasswordComponent?: PasswordInputComponent;
  @HostBinding('style.--bg-img') bgImgStyle = "";
  private imageName = this.IMAGE_NAMES[0];
  isSubmitting = false;
  newPassword: string = "";
  userId: string = "";
  govId: string = "";

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly popupService: PopupService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly modalService: NgbModal,
  ) { }

  async ngOnInit(): Promise<void> {
    const params = await firstValueFrom(this.route.queryParamMap)
    const userId = params.get("userId");
    const govId = params.get("govId");

    if (!userId || !govId) {
      this.router.navigate(["/login"]);
    } else {
      this.userId = userId;
      this.govId = govId;
    }
  }

  ngAfterViewInit(): void {
    if (!this.formElement?.nativeElement) {
      return;
    }

    const easterEggClicks$ = fromEvent(this.formElement.nativeElement, 'click');

    easterEggClicks$.pipe(
      buffer(easterEggClicks$.pipe(debounceTime(300))),
      throttleTime(300),
      map(clicks => clicks.length),
      filter(clickCount => clickCount >= 5),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.toggleBackgroundImage())
  }

  toggleBackgroundImage(): void {
    this.imageName = this.imageName.includes('noon')
      ? this.IMAGE_NAMES[1]
      : this.IMAGE_NAMES[0];

    this.bgImgStyle = this.getImageStyleFromName(this.imageName);
  }

  updateNewPassword(newPassword: string): void {
    this.newPassword = newPassword;
    this.repeatPasswordComponent?.onPasswordChange();
  }

  validateRepeatPassword(password: string): void {
    this.repeatPasswordComponent!.isValid = password !== "" && password === this.newPassword;
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    await this.submit();

    this.isSubmitting = false;
  }

  async submit(): Promise<void> {
    if (!this.validateSumbit()) {
      this.popupService.warn("הנתונים שהזנת אינם נכונים. אנא תעבור שוב ואז נסה שוב", { title: "בעיה בביצוע הפעולה" });
      return;
    }

    try {
      if (!await this.codeVerification(this.govId)) {
        this.popupService.error("קוד לא נכון");
        return;
      }

      if (!await trySendingForgotPasswordRequest(this.userId, this.newPassword)) {
        this.popupService.error("סיסמה לא השתנתה, בעיה בפניה לשרת");
      } else {
        this.popupService.success("סיסמה השתנה בהצלחה", { title: "שינוי סיסמה" });
        this.router.navigate(["/login"]);
      }
    } catch (e) {
      this.popupService.error("סיסמה לא השתנתה, בעיה בפניה לשרת");
      console.error(e);
    }
  }

  private validateSumbit(): boolean {
    return new RegExp(PASSWORD_PATTERN).test(this.newPassword) && this.repeatPasswordComponent!.isValid
  }

  private async codeVerification(govId: string): Promise<boolean> {
    if (!await trySendingCodeToUserByGovId(govId)) {
      return false;
    }

    const modalRef = this.modalService.open(PromptComponent);
    const instance: PromptComponent = modalRef.componentInstance;
    instance.promptTitle = `קוד אימות`;
    instance.promptText = `הכניסו את קוד האימות שקיבלתם במייל`;
    const inputCode = await modalRef.result;

    if (!inputCode) {
      return false;
    }

    return await isCodeVerified(govId, inputCode);
  }

  private getImageStyleFromName(imageName: string): string {
    return `url('${imageName}')`;
  }
}

