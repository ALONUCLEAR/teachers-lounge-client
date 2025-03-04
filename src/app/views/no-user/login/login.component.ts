import { AfterViewInit, Component, DestroyRef, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormControlOptions, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { tryLogin } from 'src/app/api/server/actions/user-status-actions';
import { PopupService } from 'src/app/services/popup.service';
import { PASSWORD_PATTERN } from '../sign-up/sign-up.component';
import { AuthStore } from 'src/app/stores/auth/auth.store';
import { Router } from '@angular/router';
import { ActivityStatus } from 'src/app/api/server/types/user';
import { trySendingMailTo } from 'src/app/api/server/actions/email-actions';
import { buffer, debounceTime, filter, fromEvent, map, throttleTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface LoginForm {
  govId: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
  providers: [AuthStore],
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('form') formElement?: ElementRef;
  @HostBinding('style.--bg-img') bgImgStyle = "";
  
  loginForm?: FormGroup<LoginForm>;
  readonly passwordPattern = PASSWORD_PATTERN;
  private readonly IMAGE_NAMES = ["teachers at noon.jpeg", "teachers at night.jpeg"];
  private imageName = this.IMAGE_NAMES[0];

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly formBuilder: FormBuilder,
    private readonly popupService: PopupService,
    private readonly authStore: AuthStore,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.loginForm = this.createEmptyLoginForm();
    this.bgImgStyle = this.getImageStyleFromName(this.imageName);
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

  private getFieldOptions(additionalValidators: ValidatorFn[]): FormControlOptions & { nonNullable: true } {
    return {
      nonNullable: true,
      validators: [Validators.required, ...additionalValidators]
    };
  }

  private createEmptyLoginForm(): FormGroup<LoginForm> {
    return this.formBuilder.group<LoginForm>({
      govId: this.formBuilder.control("", this.getFieldOptions([Validators.pattern(/^[\d]{8,10}$/)])),
      password: this.formBuilder.control("", this.getFieldOptions([Validators.pattern(PASSWORD_PATTERN)])),
    });
  }

  private getImageStyleFromName(imageName: string): string {
    return `url('${imageName}')`;
  }

  toggleBackgroundImage(): void {
    this.imageName = this.imageName.includes('noon')
      ? this.IMAGE_NAMES[1]
      : this.IMAGE_NAMES[0];

    this.bgImgStyle = this.getImageStyleFromName(this.imageName);
  }

  changeFormFieldValue<K extends keyof LoginForm>(field: K, value: string): void {
    const control = this.loginForm?.controls[field];

    if (control) {
      control.setValue(value);
      control.markAsDirty();
    }
  }

  async onSubmit(): Promise<void> {
    try {
      if (!this.loginForm?.valid) {
        this.popupService.error("אחד מהערכים שהזנת לא תקין");

        return;
      }

      const { govId, password } = this.loginForm.value;
      const user = await tryLogin(govId!, password!);

      if (!user) {
        throw new Error("Invalid credentials");
      }

      if (user.activityStatus !== ActivityStatus.Active) {
        const userState = user.activityStatus === ActivityStatus.Blocked ? 'חסום' : 'ממתין לאישור ראשוני';
        const revertingAction = user.activityStatus === ActivityStatus.Blocked ? 'עד שישוחזר' : 'לאישור הבקשה';
        const message = `זיהינו שניסת להתחבר למערכת חדר מורים. המשתמש שלך ${userState}.\n`
        +`נא להמתין ${revertingAction} ע"י הגורמים המאשרים הרלוונטיים.`;

        await trySendingMailTo(user.email, { title: 'נסיון התחברות למערכת חדר מורים', content: message });

        throw new Error("Inactive user login attempt");
      }

      this.authStore.update(user);

      // TODO: move to forum page when exists
      this.router.navigate(['/school-management']);
    } catch (e) {
      console.error(e);
      this.popupService.error(`בדקו את הפרטים שהזנתם או נסו שוב במועד מאוחר יותר.`, { title: "שגיאה בהתחברות" });
    }
  }
}