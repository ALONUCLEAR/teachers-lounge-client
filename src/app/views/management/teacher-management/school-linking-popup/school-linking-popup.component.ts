import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { tryLinkUserToSchool } from 'src/app/api/server/actions/user-actions';
import { DisplayedUser } from 'src/app/api/server/types/user';
import { PopupService } from 'src/app/services/popup.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';

@Component({
  selector: 'school-linking-popup',
  templateUrl: './school-linking-popup.component.html',
  styleUrls: ['./school-linking-popup.component.less'],
})
export class SchoolLinkingPopupComponent implements OnInit {
  @Input({ required: true }) currentSchoolId: string = '';
  @Input({ required: true }) allUsers: DisplayedUser[] = [];

  allSchoolUsers: DisplayedUser[] = [];
  selectedUsers: DisplayedUser[] = [];
  isLoading = false;

  constructor(
    private readonly modal: NgbActiveModal,
    private readonly popupService: PopupService,
    private readonly authQuery: AuthQuery,
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.initSchoolUsers();
    this.isLoading = false;
  }

  initSchoolUsers(): void {
    this.allSchoolUsers = this.allUsers.filter(user => !user.associatedSchools.includes(this.currentSchoolId));

    if (!this.allSchoolUsers.length) {
      this.popupService.info(`לא קיימים משתמשים שלא משוייכים כבר לבית הספר`);
      this.modal.close();
    }
  }

  setAssociatedUsers(users: DisplayedUser[]): void {
    this.selectedUsers = users;
  }

  cancel(): void {
    this.modal.close();
  }

  async save(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    if (!this.selectedUsers.length) {
      this.popupService.error(`לא נבחרו משתמשים לקשר`);
    }

    this.isLoading = true;

    if (await tryLinkUserToSchool(this.authQuery.getUserId()!, this.selectedUsers.map(({ id }) => id), this.currentSchoolId)) {
      this.modal.close(this.selectedUsers.map(user => ({...user, associatedSchools: [...user.associatedSchools, this.currentSchoolId]})));
    } else {
      this.popupService.error(`לא הצלחנו לקשר את המורים`);
    }

    this.isLoading = false;
  }
}
