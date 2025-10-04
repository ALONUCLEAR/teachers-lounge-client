import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormControlOptions, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isCodeVerified, trySendingCodeToUser } from 'src/app/api/server/actions/email-actions';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { trySendingUserRequest } from 'src/app/api/server/actions/user-actions';
import { getRoleKey, UserRoles } from 'src/app/api/server/types/permissions';
import { School } from 'src/app/api/server/types/school';
import { UserRequest } from 'src/app/api/server/types/user';
import { PromptComponent } from 'src/app/components/ui/prompt/prompt.component';
import { PopupService } from 'src/app/services/popup.service';

const supportApprovalId = "SupportApproval";
const SupportApprovedRoles = [UserRoles.SuperAdmin, UserRoles.Support];

export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$/;

interface SignUpForm {
  govId: FormControl<string>;
  email: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  password: FormControl<string>;
  confirmedPassword: FormControl<string>;
  requestedRole: FormControl<UserRoles>;
  linkedSchoolId: FormControl<string>;
  message: FormControl<string | null>;
}

@Component({
  selector: 'sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.less'],
  providers: [],
})
export class SignUpComponent implements OnInit {
  schoolList: (School & { display: string })[] = [];
  signUpForm?: FormGroup<SignUpForm>;
  roleOptions = Object.entries(UserRoles).map(([key, value]) => ({key, value}));
  defaultRole = this.roleOptions.find(role => role.value === UserRoles.Base)!;
  readonly passwordPattern = PASSWORD_PATTERN;
  passwordExplainer = `סיסמה תקינה מכילה:
  * אות גדולה באנגלית
  * אות קטנה באנגלית
  * ספרה
  * לפחות 8 תווים`;
  isSupportApprovalRequired = false;
  isLoading = false;

  constructor(
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly popupService: PopupService,
    private readonly modalService: NgbModal,
  ) {}

  async ngOnInit(): Promise<void> {
    this.signUpForm = this.createEmptySignUpForm();
    await this.initSchoolList(1000);
  }

  async initSchoolList(retryInterval: number): Promise<void> {
    try {
      const schools = await getAllSchools();
      this.schoolList = schools.map(school => ({
        ...school,
        display: `${school.name}(${school.municipality.name})`
      }));
    } catch(error) {
      console.error(error);
      this.schoolList = [];

      if (retryInterval > 3600 * 1000) {
        this.popupService.error("אחרי נסיונות רבים, לא הצלחנו לשלוף את רשימת בתי הספר.\n אם אתם מורים או מנהלים, נא נסו להרשם מאוחר יותר", { title: "שגיאה בשליפת בתי ספר" });
      } else {
        this.initSchoolList(retryInterval * 1.25);
      }
    }
  }

  private getFieldOptions(additionalValidators: ValidatorFn[]): FormControlOptions & { nonNullable: true } {
    return {
      nonNullable: true,
      validators: [Validators.required, ...additionalValidators]
    };
  }

  private createEmptySignUpForm(): FormGroup<SignUpForm> {
    const passwordOptions = this.getFieldOptions([Validators.pattern(PASSWORD_PATTERN)]);

    return this.formBuilder.group<SignUpForm>({
      govId: this.formBuilder.control("", this.getFieldOptions([Validators.pattern(/^[\d]{8,10}$/)])),
      email: this.formBuilder.control("", this.getFieldOptions([Validators.email, Validators.maxLength(127)])),
      firstName: this.formBuilder.control("", this.getFieldOptions([Validators.maxLength(31)])),
      lastName: this.formBuilder.control("", this.getFieldOptions([Validators.maxLength(63)])),
      password: this.formBuilder.control("", passwordOptions),
      confirmedPassword: this.formBuilder.control("", passwordOptions),
      requestedRole: this.formBuilder.control(this.defaultRole.value, { nonNullable: true }),
      linkedSchoolId: this.formBuilder.control("", this.getFieldOptions([])),
      message: this.formBuilder.control("", { validators: [Validators.maxLength(127)]})
    });
  }

  private isFormValid(): boolean {
    if (!this.signUpForm) {
      return false;
    }

    if (this.signUpForm.controls.password.value !== this.signUpForm.controls.confirmedPassword.value) {
      this.signUpForm.setErrors({passwordsDontMatch: "password !== confirmed"}, { emitEvent: true })
      this.popupService.error(`הסיסמאות לא תואמות`);

      return false;
    }

    return this.signUpForm.valid;
  }

  changeFormFieldValue<K extends Exclude<keyof SignUpForm, 'requestedRole'>>(field: K, value: string): void {
    const control = this.signUpForm?.controls[field];

    if (control) {
      control.setValue(value);
      control.markAsDirty();
    }
  }


  changeSelectedSchool(schoolId?: string): void {
    this.signUpForm!.controls.linkedSchoolId.setValue(schoolId ?? "");
  }

  changeSelectedRole(role: UserRoles): void {
    if (!this.signUpForm) {
      return;
    }

    this.signUpForm.controls.requestedRole.setValue(role);
    this.isSupportApprovalRequired = SupportApprovedRoles.includes(role);

    if (this.isSupportApprovalRequired) {
      this.changeSelectedSchool(supportApprovalId);
    } else if(this.signUpForm.controls.linkedSchoolId.value === supportApprovalId) {
      this.changeSelectedSchool();
    }
  }

  private serializeForm(form?: FormGroup<SignUpForm>): UserRequest | null {
    if (!form) {
      return null;
    }

    const controls = form.controls;

    return {
      govId: controls.govId.value,
      email: controls.email.value,
      info: {
        firstName: controls.firstName.value,
        lastName: controls.lastName.value,
      },
      password: controls.password.value,
      confirmedPassword: controls.confirmedPassword.value,
      requestedRole: getRoleKey(controls.requestedRole.value)!,
      associatedSchools: [controls.linkedSchoolId.value],
      message: controls.message?.value || undefined
    };
  }

  private async codeVerification(govId: string, email: string): Promise<boolean> {
    if (!await trySendingCodeToUser(govId, email)) {
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

  async onSubmit(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    await this.submitSingUpForm();

    this.isLoading = false;
  }

  private async submitSingUpForm(): Promise<void> {
    if (!this.isFormValid()) {
      return;
    }

    const formData = this.serializeForm(this.signUpForm);

    if (!formData) {
      this.popupService.error(`קיים מידע לא תקין בבקשה`);

      return;
    }

    try {
      if (!await this.codeVerification(formData.govId, formData.email)) {
        this.popupService.error(`קוד לא נכון`);

        return;
      }

      if (!await trySendingUserRequest({ id: "", ...formData})) {
        throw new Error(`Error sending user request to db`);
      }

      await this.popupService.success(`תקבלו מייל על המשך התהליך בקרוב`, { title: `ההודעה נשלחה בהצלחה` });
      this.router.navigate(['/login']);
    } catch (e) {
      console.error(e);
      this.popupService.error(`שגיאה בשליחת הבקשה`);
    }
  }
}