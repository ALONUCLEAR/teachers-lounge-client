import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../stores/auth/auth.store';

export interface Page {
  name: string;
  url: string;
}

export const REDIRECT_INFO_SESSION_STORAGE_KEY = 'redirect-info';

@Injectable({
    providedIn: 'root'
})
export class SchoolSelectionService {
    constructor(
        private readonly router: Router,
        private readonly authStore: AuthStore,
    ) {}

    startSchoolSelection(pageName: string): void {
        this.authStore.selectSchool(undefined);
        this.setRedirectPage({
            name: pageName,
            url: this.router.url
        });
        this.router.navigate(['/school-selection']);
    }

    setRedirectPage(page: Page): void {
        sessionStorage.setItem(REDIRECT_INFO_SESSION_STORAGE_KEY, JSON.stringify(page));
    }

    getRedirectPage(): Page {
        const redirectPageFromSession = sessionStorage.getItem(REDIRECT_INFO_SESSION_STORAGE_KEY);

        if (!redirectPageFromSession) {
            this.router.navigate(['/login']);
            return { name: 'login', url: '/login' };
        }

        return JSON.parse(redirectPageFromSession);
    }
}
