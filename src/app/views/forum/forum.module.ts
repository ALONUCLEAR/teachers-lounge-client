import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolForumComponent } from './school-forum/school-forum.component';
import { PostFormComponent } from 'src/app/components/post/post-form/post-form.component';

@NgModule({
  declarations: [
    SchoolForumComponent,
    PostFormComponent,
  ],
  providers: [],
  imports: [BasicModule],
  exports: []
})
export class ForumModule { }