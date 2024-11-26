import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormControlOptions, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { UserRoles } from 'src/app/api/server/types/permissions';
import { School } from 'src/app/api/server/types/school';
import { NotificationsService } from 'src/app/services/notifications.service';

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

type PasswordType = 'password' | 'text';

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
  passwordType: PasswordType = 'password';
  confirmedPasswordType: PasswordType = 'password';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly notificationsService: NotificationsService,
    private readonly modalService: NgbModal,
  ) {}

  async ngOnInit(): Promise<void> {
    this.signUpForm = this.createEmptySignUpForm();
    const schools = await getAllSchools();
    this.schoolList = schools.map(school => ({
      ...school,
      display: `${school.name}(${school.municipality.name})`
    }));
  }

  private getFieldOptions(additionalValidators: ValidatorFn[]): FormControlOptions & { nonNullable: true } {
    return {
      nonNullable: true,
      validators: [Validators.required, ...additionalValidators]
    };
  }

  private createEmptySignUpForm(): FormGroup<SignUpForm> {
    const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$/g;
    const passwordOptions = this.getFieldOptions([Validators.pattern(passwordPattern)]);

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

  changeSelectedSchool(school: School): void {
    console.log(`Changed to `, { newSchool: school });
    this.signUpForm!.controls.linkedSchoolId.setValue(school?.id);
  }

  changeSelectedRole(role: UserRoles): void {
    console.log(`Changed to `, { newRole: role });
    this.signUpForm!.controls.requestedRole.setValue(role);
  }
}