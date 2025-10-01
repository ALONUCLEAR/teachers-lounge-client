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
import { AssociationManagementComponent } from './views/management/association-management/association-management.component';
import { SchoolSelectionComponent } from './views/school-selection/school-selection.component';
import { TeacherManagementComponent } from './views/management/teacher-management/teacher-management.component';
import { SchoolForumComponent } from './views/forum/school-forum/school-forum.component';
import { PostViewComponent } from './views/forum/school-forum/post-view/post-view.component';
import { AdminManagementComponent } from './views/management/admin-management/admin-management.component';
import { SuperAdminManagementComponent } from './views/management/super-admin-management/super-admin-management.component';

const makeRouteGuarded = (route: Route, requiredRole?: UserRoles): Route => {
  return {
    ...route,
    data: { requiredRole },
    canActivate: [AuthGuard]
  };
};

const SupportRoutes: Routes = [
  { path: 'super-admin-management', pathMatch: 'full', component: SuperAdminManagementComponent },
].map(route => makeRouteGuarded(route as Route, UserRoles.Support));

const SuperAdminRoutes: Routes = [
  { path: 'school-management', pathMatch: 'full', component: SchoolManagementComponent },
  { path: 'user-status-management', pathMatch: 'full', component: UserStatusManagementComponent },
  { path: 'admin-management', pathMatch: 'full', component: AdminManagementComponent },
].map(route => makeRouteGuarded(route as Route, UserRoles.SuperAdmin));

const AdminRoutes: Routes = [
  { path: 'association-management', pathMatch: 'full', component: AssociationManagementComponent },
  { path: 'teacher-management', pathMatch: 'full', component: TeacherManagementComponent },
].map(route => makeRouteGuarded(route as Route, UserRoles.Admin));

const BaseRoutes: Routes = [
  { path: 'school-selection', pathMatch: 'full', component: SchoolSelectionComponent },
  { path: 'forum', pathMatch: 'full', component: SchoolForumComponent },
  { path: 'posts/:postId', pathMatch: 'full', component: PostViewComponent }
].map(route => makeRouteGuarded(route as Route, UserRoles.Base));

const NoUserRoutes: Routes = [
  { path: 'login', pathMatch: 'full', component: LoginComponent },
  { path: 'sign-up', pathMatch: 'full', component: SignUpComponent },
  { path: 'recovery', pathMatch: 'full', component: AccountRecoveryComponent },
  { path: 'forgot-password', pathMatch: 'full', component: ChangePasswordComponent },
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
