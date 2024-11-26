import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolManagementComponent } from './school-management/school-management.component';

@NgModule({
  declarations: [
    SchoolManagementComponent
  ],
  providers: [],
  imports: [BasicModule],
  exports: [SchoolManagementComponent]
})
export class ManagementModule { }