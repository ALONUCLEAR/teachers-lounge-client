import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolManagementComponent } from './school-management/school-management.component';
import { UserStatusManagementComponent } from './user-status-management/user-status-management.component';
import { AssociationManagementComponent } from './association-management/association-management.component';

@NgModule({
  declarations: [
    SchoolManagementComponent,
    UserStatusManagementComponent,
    AssociationManagementComponent,
  ],
  providers: [],
  imports: [BasicModule],
  exports: [SchoolManagementComponent]
})
export class ManagementModule { }