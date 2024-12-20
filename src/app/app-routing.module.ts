import { Component, NgModule, Type } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SchoolManagementComponent } from 'src/app/views/management/school-management/school-management.component';

// The routes are grouped by the lowest permission rank needed to access them
const SupportRoutes: Routes = [];

const SuperAdminRoutes: Routes = [
  { path: 'school-management', pathMatch: 'full', component: SchoolManagementComponent }
];

const AdminRoutes: Routes = [];

const BaseRoutes: Routes = [];

const NoUserRoutes: Routes = [];

const AlwaysAvaiableRoutes: Routes = [];

const routes: Routes = [
  ...AlwaysAvaiableRoutes,
  ...NoUserRoutes,
  ...BaseRoutes,
  ...AdminRoutes,
  ...SuperAdminRoutes,
  ...SupportRoutes
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
