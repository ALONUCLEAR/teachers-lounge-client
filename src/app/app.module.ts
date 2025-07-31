import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BasicModule } from './basic.module';
import { ManagementModule } from './views/management/management.module';
import { SignUpComponent } from './views/no-user/sign-up/sign-up.component';
import { AccountRecoveryComponent } from './views/no-user/account-recovery/account-recovery.component';
import { LoginComponent } from './views/no-user/login/login.component';
import { ChangePasswordComponent } from './views/no-user/change-password/change-password.component';

const subModules = [ManagementModule];

@NgModule({
  declarations: [
    AppComponent,
    SignUpComponent,
    AccountRecoveryComponent,
    LoginComponent,
    ChangePasswordComponent,
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
