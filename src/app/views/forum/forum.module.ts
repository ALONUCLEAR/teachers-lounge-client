import { NgModule } from '@angular/core';
import { BasicModule } from 'src/app/basic.module';
import { SchoolForumComponent } from './school-forum/school-forum.component';
import { PostFormComponent } from 'src/app/components/post/post-form/post-form.component';
import { PostViewComponent } from './school-forum/post-view/post-view.component';
import { AppRoutingModule } from "src/app/app-routing.module";
import {NavbarComponent} from "../../components/ui/navbar/navbar.component";

@NgModule({
  declarations: [
    SchoolForumComponent,
    PostFormComponent,
    PostViewComponent,
  ],
  providers: [],
  imports: [BasicModule, AppRoutingModule, NavbarComponent],
  exports: []
})
export class ForumModule { }
