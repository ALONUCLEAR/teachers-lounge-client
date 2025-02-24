import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterStateSnapshot
} from '@angular/router';
import { hasPermissions, UserRoles } from './api/server/types/permissions';
import { LocalAuthService } from './stores/auth/local-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredRole = route.data['requiredRole'] as UserRoles;
    const isLoggedIn = LocalAuthService.isLoggedIn();

    if (requiredRole) {
      if (!isLoggedIn || !hasPermissions(LocalAuthService.getLoggedUser()!.role, requiredRole)) {
        this.router.navigate(['/login']);

        return false;
      }

      return true;
    } else if (!isLoggedIn) {
        return true;
    } else {
        this.router.navigate(['/school-management']);

        return false;
    }
  }
}
