import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { tryLinkUserToSchools } from 'src/app/api/server/actions/user-actions';
import { School } from 'src/app/api/server/types/school';
import { User } from 'src/app/api/server/types/user';
import { PopupService } from 'src/app/services/popup.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { SchoolLinkingPopupComponent } from '../../teacher-management/school-linking-popup/school-linking-popup.component';

/**Connects current user to multiple schools, unlike {@link SchoolLinkingPopupComponent } which connects current school to multiple users */
@Component({
  selector: 'user-school-linking-popup',
  templateUrl: './user-school-linking-popup.component.html',
  styleUrls: ['./user-school-linking-popup.component.less'],
})
export class UserSchoolLinkingPopupComponent implements OnInit {
  @Input({ required: true }) currentUser: User = {} as User;
  @Input({ required: true }) allSchools: School[] = [];

  selectedSchools: School[] = [];
  isLoading = false;

  constructor(
    private readonly modal: NgbActiveModal,
    private readonly popupService: PopupService,
    private readonly authQuery: AuthQuery,
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.initSchools();
    this.isLoading = false;
  }

  initSchools(): void {
    const initiallySelectedSchools = this.currentUser.associatedSchools;
    this.selectedSchools = this.allSchools.filter(school => initiallySelectedSchools.includes(school.id));
  }

  setAssociatedSchools(schools: School[]): void {
    this.selectedSchools = schools;
  }

  cancel(): void {
    this.modal.close();
  }

  async onSubmit(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    await this.submit();
    this.isLoading = false;
  }

  async submit(): Promise<void> {
    if (!this.selectedSchools.length) {
      this.popupService.error(`לא נבחרו בתי ספר לקשר`);

      return;
    }

    const selectedSchoolIds = this.selectedSchools.map(school => school.id);

    if (await tryLinkUserToSchools(this.authQuery.getUserId()!, this.currentUser.id, selectedSchoolIds)) {
      this.modal.close(selectedSchoolIds);
    } else {
      this.popupService.error(`לא הצלחנו לקשר את המשתמש לבתי הספר`);
    }
  }
}
