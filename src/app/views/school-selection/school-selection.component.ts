import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { getAllSchools } from 'src/app/api/server/actions/school-actions';
import { hasPermissions, UserRoles } from 'src/app/api/server/types/permissions';
import { School } from 'src/app/api/server/types/school';
import { LoaderComponent } from 'src/app/components/ui/loader/loader.component';
import { SearchComponent } from 'src/app/components/ui/search/search.components';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { AuthStore } from 'src/app/stores/auth/auth.store';
import { Page, SchoolSelectionService } from './school-selection.service';

@Component({
  selector: 'school-selection',
  templateUrl: './school-selection.component.html',
  styleUrls: ['./school-selection.component.less'],
  standalone: true,
  imports: [SearchComponent, CommonModule, LoaderComponent],
  providers: [AuthStore, AuthQuery],
})
export class SchoolSelectionComponent implements OnInit {
  isLoading = false;

  schools: School[] = [];
  redirectPage?: Page;
  selectedSchoolId?: string;
  
  constructor(
    private readonly authStore: AuthStore,
    private readonly authQuery: AuthQuery,
    private readonly router: Router,
    private readonly schoolSelectionService: SchoolSelectionService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.redirectPage = this.schoolSelectionService.getRedirectPage();
    this.schools = (await getAllSchools()).map(school => ({ ...school, name: `${school.name}(${school.municipality.name})`}));

    const userState = this.authQuery.getValue();

    if (!hasPermissions(userState.role, UserRoles.SuperAdmin)) {
      // admins can only edit associations for their own schools
      const associatedSchoolIds = userState?.associatedSchools ?? [];
      this.schools = this.schools.filter(school => associatedSchoolIds.includes(school.id));
    }
    this.isLoading = false;
  }

  selectSchool(schoolId?: string): void {
    this.selectedSchoolId = schoolId;
  }

  async save(): Promise<void> {
    if (!this.selectedSchoolId || !this.redirectPage) {
      return;
    }

    this.isLoading = true;
    this.authStore.selectSchool(this.selectedSchoolId);
    await this.router.navigateByUrl(this.redirectPage!.url);
    this.isLoading = false;
  }

  async logout(): Promise<void> {
    this.isLoading = true;
    this.authStore.logoutUser();
    await this.router.navigate(['/login']);
    this.isLoading = false;
  }
}