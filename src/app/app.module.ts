import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BasicModule } from './basic.module';
import { ManagementModule } from './views/management/management.module';

const subModules = [ManagementModule];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AppRoutingModule,
    BasicModule,
    ...subModules,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
