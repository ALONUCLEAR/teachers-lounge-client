import { AfterViewInit, Component, DestroyRef, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { buffer, debounceTime, filter, firstValueFrom, fromEvent, map, throttleTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PASSWORD_PATTERN } from '../sign-up/sign-up.component';
import { PasswordInputComponent } from 'src/app/components/ui/password-input/password-input.component';
import { PopupService } from 'src/app/services/popup.service';
import { trySendingForgotPasswordRequest } from 'src/app/api/server/actions/user-actions';
import { ActivatedRoute, Router } from '@angular/router';

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
    isLoading: boolean = false;
    newPassword: string = "";
    userId: string = "";

    constructor(private destroyRef: DestroyRef, private popupService: PopupService, private route: ActivatedRoute, private router: Router) {}

    async ngOnInit(): Promise<void> {
      const params = await firstValueFrom(this.route.queryParamMap)
      const userId = params.get("userId");
      userId === null || userId === undefined ?  this.router.navigate(["/login"]) : this.userId = userId;
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

    async submit(): Promise<void> {
      this.isLoading = true;
      if (this.validateSumbit()) {

        try {
          await trySendingForgotPasswordRequest(this.userId, this.newPassword) 
          ? this.popupService.success("סיסמה השתנה בהצלחה", {title: "שינוי סיסמה"}) 
          : this.popupService.error("סיסמה לא השתנתה, בעיה בפניה לשרת");
        } catch (e) {
          this.popupService.error("סיסמה לא השתנתה, בעיה בפניה לשרת");
          console.error(e);
          this.isLoading = false;
        } 
      } else {
          this.popupService.warn("הנותים שהזנת אינם נכונים. אנא תעבור שוב ואז נסה שוב", {title: "בעיה בביצוע הפעולה"});
      }

      this.isLoading = false;
    }

    private validateSumbit(): boolean {
      return new RegExp(PASSWORD_PATTERN).test(this.newPassword) && this.repeatPasswordComponent!.isValid
    }

    private getImageStyleFromName(imageName: string): string {
      return `url('${imageName}')`;
    }
}

