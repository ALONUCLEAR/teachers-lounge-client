import { NgModule } from "@angular/core";

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from "@angular/platform-browser";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";

const basicModules = [
    BrowserModule, CommonModule, FormsModule, ReactiveFormsModule, NgbModule
];

@NgModule({
    declarations: [],
    imports: [...basicModules],
    providers: [],
    exports: [...basicModules],
  })
 export class BasicModule {}