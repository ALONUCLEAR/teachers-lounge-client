import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolForumComponent } from './school-forum/school-forum.component';

@NgModule({
  declarations: [
    SchoolForumComponent
  ],
  providers: [],
  imports: [BasicModule],
  exports: []
})
export class ForumModule { }