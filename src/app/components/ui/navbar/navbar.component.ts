import { Component, DestroyRef, TemplateRef, ViewChild } from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { NgbAccordionModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { hasPermissions, UserRoles } from "../../../api/server/types/permissions";
import { LocalAuthService } from "../../../stores/auth/local-auth.service";
import { AuthStore } from "src/app/stores/auth/auth.store";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

enum PageCategory {
  SUPPORT_PAGES = 'מסכי תמיכה',
  SUPER_ADMIN_PAGES = 'מסכי בכירים',
  SCHOOL_ADMIN_PAGES = 'מסכי מנהל'
}

interface PageData {
  label: string;
  link: string;
  role: UserRoles;
  category: PageCategory;
}

@Component({
  standalone: true,
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
  imports: [CommonModule, RouterLink, RouterLinkActive, NgOptimizedImage, NgbAccordionModule]
})
export class NavbarComponent {
  isMenuOpen = false;
  groupedMenus: { title: PageCategory, items: PageData[] }[] = [];
  activeCategory?: PageCategory;

  private readonly rawMenuItems: PageData[] = [
    { label: 'ניהול רשימת בכירים', link: '/super-admin-management', role: UserRoles.Support, category: PageCategory.SUPPORT_PAGES },
    { label: 'ניהול רשימת מנהלים', link: '/admin-management', role: UserRoles.SuperAdmin, category: PageCategory.SUPER_ADMIN_PAGES },
    { label: 'ניהול רשימת בתי ספר', link: '/school-management', role: UserRoles.SuperAdmin, category: PageCategory.SUPER_ADMIN_PAGES },
    { label: 'ניהול סטטוסי משתמשים', link: '/user-status-management', role: UserRoles.SuperAdmin, category: PageCategory.SUPER_ADMIN_PAGES },
    { label: 'ניהול רשימת שיוכים', link: '/association-management', role: UserRoles.Admin, category: PageCategory.SCHOOL_ADMIN_PAGES },
    { label: 'ניהול רשימת מורים', link: '/teacher-management', role: UserRoles.Admin, category: PageCategory.SCHOOL_ADMIN_PAGES }
  ];

  constructor(
    private readonly offcanvasService: NgbOffcanvas,
    private readonly authStore: AuthStore,
    private readonly destroyRef: DestroyRef,
    private readonly router: Router,
  ) {}

  private initMenu(): void {
    const userRole = LocalAuthService.getLoggedUser()?.role;
    if (!userRole) return;

    const currentUrl = this.router.url;
    this.activeCategory = undefined;
    const groups = new Map<PageCategory, PageData[]>();

    this.rawMenuItems.forEach(item => {
      if (hasPermissions(userRole, item.role)) {
        if (!groups.has(item.category)) {
          groups.set(item.category, []);
        }

        groups.get(item.category)?.push(item);

        if (currentUrl.includes(item.link)) {
          this.activeCategory = item.category;
        }
      }
    });

    this.groupedMenus = Array.from(groups, ([title, items]) => ({ title, items }));
  }

  toggleMenu(content: TemplateRef<any>): void {
    this.initMenu();
    this.isMenuOpen = true;
    const ref = this.offcanvasService.open(content, { position: 'end', panelClass: 'menu-offcanvas' });
    
    ref.hidden.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isMenuOpen = false;
    });
  }

  closeMenu(): void {
    this.offcanvasService.dismiss();
  }

  async logOut(): Promise<void> {
    await this.authStore.logoutUser();
    this.closeMenu();
  }
}