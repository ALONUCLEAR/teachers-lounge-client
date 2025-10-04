import { NgModule } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { UserRoles } from './api/server/types/permissions';
import { AuthGuard } from './auth.guard';
import { LoginComponent } from './views/no-user/login/login.component';

const makeRouteGuarded = (route: Route, requiredRole?: UserRoles): Route => {
  return {
    ...route,
    data: { requiredRole },
    canActivate: [AuthGuard]
  };
};

const SupportRoutes: Routes = [
  { path: 'super-admin-management', pathMatch: 'full', loadChildren: () => import('./views/management/super-admin-management/super-admin-management.component').then(m => m.SuperAdminManagementComponent) }
].map(route => makeRouteGuarded(route as Route, UserRoles.Support));

const SuperAdminRoutes: Routes = [
  { path: 'school-management', pathMatch: 'full', loadChildren: () => import('./views/management/school-management/school-management.component').then(m => m.SchoolManagementComponent) },
  { path: 'user-status-management', pathMatch: 'full', loadChildren: () => import('./views/management/user-status-management/user-status-management.component').then(m => m.UserStatusManagementComponent) },
  { path: 'admin-management', pathMatch: 'full', loadChildren: () => import('./views/management/admin-management/admin-management.component').then(m => m.AdminManagementComponent) }
].map(route => makeRouteGuarded(route as Route, UserRoles.SuperAdmin));

const AdminRoutes: Routes = [
  { path: 'association-management', pathMatch: 'full', loadChildren: () => import('./views/management/association-management/association-management.component').then(m => m.AssociationManagementComponent) },
  { path: 'teacher-management', pathMatch: 'full', loadChildren: () => import('./views/management/teacher-management/teacher-management.component').then(m => m.TeacherManagementComponent) },
].map(route => makeRouteGuarded(route as Route, UserRoles.Admin));

const BaseRoutes: Routes = [
  { path: 'school-selection', pathMatch: 'full', loadComponent: () => import('./views/school-selection/school-selection.component').then(m => m.SchoolSelectionComponent) },
  { path: 'forum', pathMatch: 'full', loadComponent: () => import('./views/forum/school-forum/school-forum.component').then(m => m.SchoolForumComponent)  },
  { path: 'posts/:postId', pathMatch: 'full', loadComponent: () => import('./views/forum/school-forum/post-view/post-view.component').then(m=>m.PostViewComponent) }
].map(route => makeRouteGuarded(route as Route, UserRoles.Base));

const NoUserRoutes: Routes = [
  { path: 'login', pathMatch: 'full', component: LoginComponent },
  { path: 'sign-up', pathMatch: 'full', loadComponent: () => import('./views/no-user/sign-up/sign-up.component').then(m => m.SignUpComponent) },
  { path: 'recovery', pathMatch: 'full', loadComponent: () => import('./views/no-user/account-recovery/account-recovery.component').then(m => m.AccountRecoveryComponent) },
  { path: 'forgot-password', pathMatch: 'full', loadComponent: () => import('./views/no-user/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
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
