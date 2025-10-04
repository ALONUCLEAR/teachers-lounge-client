import { AfterViewInit, Component, DestroyRef, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormControlOptions, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { buffer, debounceTime, filter, fromEvent, map, throttleTime } from 'rxjs';
import { tryGettingUserByGovId, tryLogin } from 'src/app/api/server/actions/user-actions';
import { PopupService } from 'src/app/services/popup.service';
import { AuthStore } from 'src/app/stores/auth/auth.store';
import { PASSWORD_PATTERN } from '../sign-up/sign-up.component';

interface LoginForm {
  govId: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less'],
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('form') formElement?: ElementRef;
  @HostBinding('style.--bg-img') bgImgStyle = "";
  
  loginForm?: FormGroup<LoginForm>;
  isLoading = false;
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
    return `url('assets/images/${imageName}')`;
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
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    await this.tryLogin();

    this.isLoading = false;
  }

  async tryLogin(): Promise<void> {
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

      this.authStore.updateUser({ ...user, role: user.role! });

      await this.router.navigate(['/forum']);
    } catch (e) {
      console.error(e);
      this.popupService.error(`בדקו את הפרטים שהזנתם או נסו שוב במועד מאוחר יותר.`, { title: "שגיאה בהתחברות" });
    }
  }

  async navigateToForgotPassword(): Promise<void> {
    try {
      const govId = this.loginForm!.value["govId"]!;
      const user = await tryGettingUserByGovId(govId);
      
      if (user) {
        this.router.navigate(["/forgot-password"], { queryParams: { userId: user.id, govId } });
      } else {
        this.popupService.warn("אנא הזן תז נכון");
      }
    } catch (e) {
      this.popupService.warn("אנא הזן תז נכון");
      console.error(e);
    }
  }
}