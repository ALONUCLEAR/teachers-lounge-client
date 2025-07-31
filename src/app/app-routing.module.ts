import { NgModule } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { SchoolManagementComponent } from 'src/app/views/management/school-management/school-management.component';
import { AccountRecoveryComponent } from './views/no-user/account-recovery/account-recovery.component';
import { SignUpComponent } from './views/no-user/sign-up/sign-up.component';
import { UserStatusManagementComponent } from './views/management/user-status-management/user-status-management.component';
import { LoginComponent } from './views/no-user/login/login.component';
import { ChangePasswordComponent } from './views/no-user/change-password/change-password.component';
import { UserRoles } from './api/server/types/permissions';
import { AuthGuard } from './auth.guard';

const makeRouteGuarded = (route: Route, requiredRole?: UserRoles): Route => {
  return {
    ...route,
    data: { requiredRole },
    canActivate: [AuthGuard]
  };
};

const SupportRoutes: Routes = [].map(route => makeRouteGuarded(route as Route, UserRoles.Support));

const SuperAdminRoutes: Routes = [
  { path: 'school-management', pathMatch: 'full', component: SchoolManagementComponent },
  { path: 'user-status-management', pathMatch: 'full', component: UserStatusManagementComponent }
].map(route => makeRouteGuarded(route as Route, UserRoles.SuperAdmin));

const AdminRoutes: Routes = [].map(route => makeRouteGuarded(route as Route, UserRoles.Admin));

const BaseRoutes: Routes = [].map(route => makeRouteGuarded(route as Route, UserRoles.Base));

const NoUserRoutes: Routes = [
  { path: 'login', pathMatch: 'full', component: LoginComponent },
  { path: 'sign-up', pathMatch: 'full', component: SignUpComponent },
  { path: 'recovery', pathMatch: 'full', component: AccountRecoveryComponent },
  { path: 'forgot-password', pathMatch: 'full', component: ChangePasswordComponent },
  { path: 'recovery', pathMatch: 'full', component: AccountRecoveryComponent }
].map(route => makeRouteGuarded(route as Route));

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
