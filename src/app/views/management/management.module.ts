import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolManagementComponent } from './school-management/school-management.component';
import { UserStatusManagementComponent } from './user-status-management/user-status-management.component';

@NgModule({
  declarations: [
    SchoolManagementComponent, UserStatusManagementComponent
  ],
  providers: [],
  imports: [BasicModule],
  exports: [SchoolManagementComponent]
})
export class ManagementModule { }