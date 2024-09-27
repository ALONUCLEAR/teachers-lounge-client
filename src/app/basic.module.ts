import { NgModule } from "@angular/core";

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from "@angular/platform-browser";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { DropDownComponent } from "./components/ui/drop-down/drop-down.component";
import { SearchComponent } from "./components/ui/search/search.components";
import { ConfirmationPopupComponent } from "./components/ui/confirmation-popup/confirmation-popup.component";
import { ToastService } from "./services/toast.service";

const basicModules = [
    BrowserModule, CommonModule,
    FormsModule, ReactiveFormsModule,
    NgbModule
];

const standaloneComponents = [
    DropDownComponent,
    SearchComponent,
    ConfirmationPopupComponent,
];

const services = [ToastService];

@NgModule({
    declarations: [],
    imports: [...basicModules, ...standaloneComponents],
    providers: [services],
    exports: [...basicModules, ...standaloneComponents],
  })
 export class BasicModule {}