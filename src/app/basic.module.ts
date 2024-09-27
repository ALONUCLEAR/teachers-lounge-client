import { NgModule } from "@angular/core";

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from "@angular/platform-browser";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { DropDownComponent } from "./components/ui/drop-down/drop-down.component";
import { SearchComponent } from "./components/search/search.components";

const basicModules = [
    BrowserModule, CommonModule, FormsModule, ReactiveFormsModule, NgbModule
];

const standaloneComponents = [
    DropDownComponent, SearchComponent
];

@NgModule({
    declarations: [],
    imports: [...basicModules, ...standaloneComponents],
    providers: [],
    exports: [...basicModules, ...standaloneComponents],
  })
 export class BasicModule {}