import { NgModule } from "@angular/core";

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from "@angular/platform-browser";
import { NgbModule, NgbNavModule, NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { DropDownComponent } from "./components/ui/drop-down/drop-down.component";
import { SearchComponent } from "./components/ui/search/search.components";
import { ConfirmationPopupComponent } from "./components/ui/confirmation-popup/confirmation-popup.component";
import { NotificationsService } from "./services/notifications.service";
import { MyTableComponent } from "./components/ui/my-table/my-table.components";
import { PasswordInputComponent } from "./components/ui/password-input/password-input.component";
import { PopupService } from "./services/popup.service";
import { PromptComponent } from "./components/ui/prompt/prompt.component";
import { LoaderComponent } from "./components/ui/loader/loader.component";
import { SelectedSchoolInfoComponent } from "./components/selected-school-info/selected-school-info.component";
import { ListViewComponent } from "./components/ui/list-view/list-view.component";
import { FuncPipe } from "./pipes/func.pipe";
import { PostComponent } from "./components/post/post.component";

const basicModules = [
    BrowserModule, CommonModule,
    FormsModule, ReactiveFormsModule,
    NgbModule, NgbTooltipModule, NgbNavModule,
];

const standaloneComponents = [
    DropDownComponent,
    SearchComponent,
    ConfirmationPopupComponent,
    PromptComponent,
    ListViewComponent,
    MyTableComponent,
    PasswordInputComponent,
    LoaderComponent,
    SelectedSchoolInfoComponent,
    PostComponent,
];

const services = [NotificationsService, PopupService];

const pipes = [FuncPipe];

@NgModule({
    declarations: [],
    imports: [...basicModules, ...standaloneComponents, ...pipes],
    providers: [...services],
    exports: [...basicModules, ...standaloneComponents, ...pipes],
  })
 export class BasicModule {}