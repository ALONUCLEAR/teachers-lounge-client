import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SchoolSelectionService } from '../../views/school-selection/school-selection.service';
import { AuthQuery } from 'src/app/stores/auth/auth.query';
import { hasPermissions, UserRoles } from 'src/app/api/server/types/permissions';

@Component({
  standalone: true,
  selector: 'selected-school-info',
  templateUrl: './selected-school-info.component.html',
  styleUrls: ['./selected-school-info.component.less'],
  imports: [CommonModule]
})
export class SelectedSchoolInfoComponent implements OnInit {
  @Input({ required: true }) selectedSchoolName: string = '';
  @Input({ required: true }) pageName: string = '';

  hasOtherOptions = false;

  constructor(
    private readonly authQuery: AuthQuery,
    private readonly schoolSelectionService: SchoolSelectionService,
  ) {}

  ngOnInit(): void {
    const { role: userRole, associatedSchools } = this.authQuery.getValue();
    const isSuperAdminOrAbove = hasPermissions(userRole, UserRoles.SuperAdmin);
    this.hasOtherOptions = isSuperAdminOrAbove || associatedSchools.length > 1;
  }

  changeSchool(): void {
    this.schoolSelectionService.startSchoolSelection(this.pageName);
  }
}
