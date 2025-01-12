import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormControlOptions, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { UserRoles } from 'src/app/api/server/types/permissions';
import { School } from 'src/app/api/server/types/school';

type SignUpForm = {
  govId: FormControl<string>,
  email: FormControl<string>,
  firstName: FormControl<string>,
  lastName: FormControl<string>
  password: FormControl<string>,
  confirmedPassword: FormControl<string>,
  requestedRole: FormControl<UserRoles>,
  linkedSchoolId: FormControl<string>,
  message: FormControl<string | null>
}

@Component({
  selector: 'sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.less'],
  providers: [],
})
export class SignUpComponent {
  schoolList: (School & { display: string })[] = [];
  signUpForm?: FormGroup<SignUpForm>;
  roleOptions = Object.entries(UserRoles).map(([key, value]) => ({key, value}));
  defaultRole = this.roleOptions.find(role => role.value === UserRoles.Base)!;
  readonly passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$/g;
  passwordExplainer = `סיסמה תקינה מכילה:
  * אות גדולה באנגלית
  * אות קטנה באנגלית
  * ספרה
  * לפחות 8 תווים`

  constructor(
    private readonly formBuilder: FormBuilder
  ) {}

  async ngOnInit(): Promise<void> {
    this.signUpForm = this.createEmptySignUpForm();
    await this.initSchoolList();
  }

  async initSchoolList(): Promise<void> {
    try {
      const schools = await getAllSchools();
      this.schoolList = schools.map(school => ({
        ...school,
        display: `${school.name}(${school.municipality.name})`
      }));
    } catch(error) {
      console.error(error);
      this.schoolList = [];
    }
  }

  private getFieldOptions(additionalValidators: ValidatorFn[]): FormControlOptions & { nonNullable: true } {
    return {
      nonNullable: true,
      validators: [Validators.required, ...additionalValidators]
    };
  }

  private createEmptySignUpForm(): FormGroup<SignUpForm> {
    const passwordOptions = this.getFieldOptions([Validators.pattern(this.passwordPattern)]);

    return this.formBuilder.group<SignUpForm>({
      govId: this.formBuilder.control("", this.getFieldOptions([Validators.pattern(/^[\d]{8,10}$/g)])),
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

  changeFormFieldValue<K extends Exclude<keyof SignUpForm, 'requestedRole'>>(field: K, value: string): void {
    const control = this.signUpForm?.controls[field];

    if (control) {
      control.setValue(value);
      control.markAsDirty();
    }
  }


  changeSelectedSchool(school: School): void {
    console.log(`Changed to `, { newSchool: school });
    this.signUpForm!.controls.linkedSchoolId.setValue(school?.id);
  }

  changeSelectedRole(role: UserRoles): void {
    console.log(`Changed to `, { newRole: role });
    this.signUpForm!.controls.requestedRole.setValue(role);
  }

  onSubmit(): void {
    console.log(`Reached on submit`);
    if (this.signUpForm?.valid) {
      // Handle form submission logic
      console.log('Form Submitted!', this.signUpForm.value);
      alert('Submitted a valid form');
    }
  }
}