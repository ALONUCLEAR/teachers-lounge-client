import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolManagementComponent } from './school-management/school-management.component';
import { UserApprovalComponent } from './user-approval/user-approval.component';

@NgModule({
  declarations: [
    SchoolManagementComponent, UserApprovalComponent
  ],
  providers: [],
  imports: [BasicModule],
  exports: [SchoolManagementComponent]
})
export class ManagementModule { }