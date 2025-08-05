import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolForumComponent } from './school-forum/school-forum.component';
import { PostFormComponent } from 'src/app/components/post/post-form/post-form.component';
import { PostViewComponent } from './school-forum/post-view/post-view.component';

@NgModule({
  declarations: [
    SchoolForumComponent,
    PostFormComponent,
    PostViewComponent,
  ],
  providers: [],
  imports: [BasicModule],
  exports: []
})
export class ForumModule { }