import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolManagementComponent } from './school-management/school-management.component';
import { MyTableComponent } from "../../components/ui/my-table/my-table.components";
import { SearchComponent } from 'src/app/components/ui/search/search.components';

@NgModule({
  declarations: [
    SchoolManagementComponent
  ],
  providers: [],
  imports: [BasicModule],
  exports: [SchoolManagementComponent]
})
export class ManagementModule { }