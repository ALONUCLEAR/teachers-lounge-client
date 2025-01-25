import { NgModule } from "@angular/core";

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from "@angular/platform-browser";
import { NgbModule, NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { DropDownComponent } from "./components/ui/drop-down/drop-down.component";
import { SearchComponent } from "./components/ui/search/search.components";
import { ConfirmationPopupComponent } from "./components/ui/confirmation-popup/confirmation-popup.component";
import { NotificationsService } from "./services/notifications.service";
import { MyTableComponent } from "./components/ui/my-table/my-table.components";
import { PasswordInputComponent } from "./components/ui/password-input/password-input.component";
import { PopupService } from "./services/popup.service";
import { PromptComponent } from "./components/ui/prompt/prompt.component";

const basicModules = [
    BrowserModule, CommonModule,
    FormsModule, ReactiveFormsModule,
    NgbModule, NgbTooltipModule
];

const standaloneComponents = [
    DropDownComponent,
    SearchComponent,
    ConfirmationPopupComponent,
    PromptComponent,
    MyTableComponent,
    PasswordInputComponent
];

const services = [NotificationsService, PopupService];

@NgModule({
    declarations: [],
    imports: [...basicModules, ...standaloneComponents],
    providers: [services],
    exports: [...basicModules, ...standaloneComponents],
  })
 export class BasicModule {}