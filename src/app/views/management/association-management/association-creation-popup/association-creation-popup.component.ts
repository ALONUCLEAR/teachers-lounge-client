import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AssociationType } from 'src/app/api/server/types/association';
import { School } from 'src/app/api/server/types/school';
import { DisplayedUser } from 'src/app/api/server/types/user';
import { setFormArray } from 'src/app/utils/form-utils';
import { DisplayedAssociationInfo } from '../association-management.component';
import { AssociationForm, AssociationManagementService } from '../association-management.service';

@Component({
  selector: 'association-creation-popup',
  templateUrl: './association-creation-popup.component.html',
  styleUrls: ['./association-creation-popup.component.less'],
  providers: [],
})
export class AssociationCreationPopupComponent implements OnInit {
  @Input({ required: true }) currentSchoolId: string = '';
  @Input({ required: true }) allSchools: School[] = [];
  @Input({ required: true }) allUsers: DisplayedUser[] = [];
  @Input({ required: true }) selectedAssociationType = AssociationType.Normal;
  associationForm?: FormGroup<AssociationForm>;
  allSchoolUsers: DisplayedUser[] = [];
  isLoading = false;

  readonly AssociationType = AssociationType;

  constructor(
    private readonly modal: NgbActiveModal,
    private readonly associationManagementService: AssociationManagementService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.associationForm = this.associationManagementService.createEmptyAssociationForm(this.currentSchoolId);
    this.newAssociationInfo.associatedSchools = [this.allSchools.find(school => school.id === this.currentSchoolId)!];
    this.initSchoolUsers(this.newAssociationInfo.associatedSchools);
    this.isLoading = false;
  }

  newAssociationInfo: DisplayedAssociationInfo = {
    associatedSchools: [],
    associatedUsers: []
  };

  setAssociationName(associationName: string): void {
    this.associationForm!.controls.name.setValue(associationName);
  }

  setAssociatedSchools(schools: School[]): void {
    this.newAssociationInfo.associatedSchools = schools;
    setFormArray(this.associationForm!.controls.associatedSchools, schools.map(school => school.id));
    this.initSchoolUsers(schools);
  }

  initSchoolUsers(schools: School[]): void {
    this.allSchoolUsers = this.allUsers.filter(user => schools.some(school => user.associatedSchools.includes(school.id)));
  }

  setAssociatedUsers(users: DisplayedUser[]): void {
    this.newAssociationInfo.associatedUsers = users;
    setFormArray(this.associationForm!.controls.associatedUsers, users.map(user => user.id))
  }

  cancel(): void {
    this.modal.close();
  }

  async save(): Promise<void> {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    if (await this.associationManagementService.upsertAssociation({ type: this.selectedAssociationType }, this.associationForm!, this.currentSchoolId)) {
      this.modal.close(true);
    }

    this.isLoading = false;
  }
}
