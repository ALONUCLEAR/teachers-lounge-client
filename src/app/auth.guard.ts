import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterStateSnapshot,
    UrlTree,
} from '@angular/router';
import { hasPermissions, UserRoles } from './api/server/types/permissions';
import { LocalAuthService } from './stores/auth/local-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private previousUrl?: string;

  constructor(
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const requiredRole = route.data['requiredRole'] as UserRoles;
    const isLoggedIn = LocalAuthService.isLoggedIn();
    const currentUrl = state.url;

    if (requiredRole) {
      if (!isLoggedIn) {
        return this.handleUnauthorizedAccess(currentUrl, '/login');
      }

      if (!hasPermissions(LocalAuthService.getLoggedUser()!.role, requiredRole)) {
        return this.handleUnauthorizedAccess(currentUrl);
      }

      return this.handleValidUrls(currentUrl);
    } else if (!isLoggedIn) {
      return this.handleValidUrls(currentUrl);
    } else {
        return this.handleUnauthorizedAccess(currentUrl);
    }
  }

  private handleUnauthorizedAccess(currentUrl: string, fallBackUrl = '/school-management'): UrlTree {
    const returnUrl = this.getReturnUrl(currentUrl);

    if (!returnUrl) {
      return this.router.createUrlTree([fallBackUrl]);
    }
    
    const returnUrlTree = this.router.parseUrl(returnUrl);
        
    return returnUrlTree;
  }

  private getReturnUrl(currentUrl: string): string | undefined {
    if (this.previousUrl === currentUrl) {
      // make it undefined so we don't end up with an endless recursive loop
      this.previousUrl = undefined;
    }

    return this.previousUrl;
  }

  private handleValidUrls(currentUrl: string): boolean {
    this.previousUrl = currentUrl;

    return true;
  }
}
