import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SchoolManagementComponent } from 'src/app/views/management/school-management/school-management.component';
import { AccountRecoveryComponent } from './views/no-user/account-recovery/account-recovery.component';
import { SignUpComponent } from './views/no-user/sign-up/sign-up.component';
import { UserStatusManagementComponent } from './views/management/user-status-management/user-status-management.component';
import { LoginComponent } from './views/no-user/login/login.component';

// The routes are grouped by the lowest permission rank needed to access them
const SupportRoutes: Routes = [];

const SuperAdminRoutes: Routes = [
  { path: 'school-management', pathMatch: 'full', component: SchoolManagementComponent },
  { path: 'user-status-management', pathMatch: 'full', component: UserStatusManagementComponent }
];

const AdminRoutes: Routes = [];

const BaseRoutes: Routes = [];

const NoUserRoutes: Routes = [
  { path: 'login', pathMatch: 'full', component: LoginComponent },
  { path: 'sign-up', pathMatch: 'full', component: SignUpComponent },
  { path: 'recovery', pathMatch: 'full', component: AccountRecoveryComponent }
];

const AlwaysAvaiableRoutes: Routes = [];

const routes: Routes = [
  ...AlwaysAvaiableRoutes,
  ...NoUserRoutes,
  ...BaseRoutes,
  ...AdminRoutes,
  ...SuperAdminRoutes,
  ...SupportRoutes,
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
