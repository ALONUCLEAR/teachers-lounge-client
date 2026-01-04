import {Component, HostListener} from "@angular/core";
import {CommonModule, NgOptimizedImage} from "@angular/common";
import {RouterLink, RouterLinkActive} from "@angular/router";
import {hasPermissions, UserRoles} from "../../../api/server/types/permissions";
import {LocalAuthService} from "../../../stores/auth/local-auth.service";

@Component({
  standalone: true,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
  imports: [CommonModule, RouterLink, RouterLinkActive, NgOptimizedImage]
})
export class NavbarComponent {
  isMenuOpen = false;

  menuItems = [
    { label: 'ניהול מנהלי-על', link: '/super-admin-management', neededPermission: hasPermissions(LocalAuthService.getLoggedUser()!.role,  UserRoles.Support)},
    { label: 'ניהול מנהלים', link: '/admin-management', neededPermission: hasPermissions(LocalAuthService.getLoggedUser()!.role,  UserRoles.SuperAdmin) },
    { label: 'ניהול בתי ספר', link: '/school-management', neededPermission: hasPermissions(LocalAuthService.getLoggedUser()!.role,  UserRoles.SuperAdmin) },
    { label: 'ניהול משתמשים', link: '/user-status-management', neededPermission: hasPermissions(LocalAuthService.getLoggedUser()!.role,  UserRoles.SuperAdmin) },
    { label: 'ניהול אגודות', link: '/association-management', neededPermission: hasPermissions(LocalAuthService.getLoggedUser()!.role,  UserRoles.Admin) },
    { label: 'ניהול מורים', link: '/teacher-management', neededPermission: hasPermissions(LocalAuthService.getLoggedUser()!.role,  UserRoles.Admin) },
    { label: 'פורום בית ספר', link: '/forum', neededPermission: hasPermissions(LocalAuthService.getLoggedUser()!.role,  UserRoles.Base) }
  ];

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  hasPermissions(role: UserRoles) {
    return ;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-container')) {
      this.isMenuOpen = false;
    }
  }
}
