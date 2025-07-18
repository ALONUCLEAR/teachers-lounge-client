import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolManagementComponent } from './school-management/school-management.component';
import { UserStatusManagementComponent } from './user-status-management/user-status-management.component';
import { AssociationManagementComponent } from './association-management/association-management.component';
import { AssociationCreationPopupComponent } from './association-management/association-creation-popup/association-creation-popup.component';
import { AssociationManagementService } from './association-management/association-management.service';

@NgModule({
  declarations: [
    SchoolManagementComponent,
    UserStatusManagementComponent,
    AssociationManagementComponent,
    AssociationCreationPopupComponent,
  ],
  providers: [AssociationManagementService],
  imports: [BasicModule],
  exports: [SchoolManagementComponent]
})
export class ManagementModule { }