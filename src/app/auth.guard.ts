import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterStateSnapshot
} from '@angular/router';
import { hasPermissions, UserRoles } from './api/server/types/permissions';
import { AuthState } from './stores/auth/auth.store';
import { LocalAuthService } from './stores/auth/local-auth.service';

@Injectable({
  providedIn: 'root'  // Make sure the guard is provided in the root
})
export class AuthGuard implements CanActivate {
  constructor(
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const requiredRole = route.data['requiredRole'] as UserRoles; // Get the required role from route data
    const isLoggedIn = LocalAuthService.isLoggedIn();
    console.log({user: LocalAuthService.getLoggedUser(), isLoggedIn,
        requiredRole, hasPermissions: isLoggedIn ? hasPermissions(LocalAuthService.getLoggedUser()!.role, requiredRole) : false})

    if (requiredRole) {
      if (!isLoggedIn || !hasPermissions(LocalAuthService.getLoggedUser()!.role, requiredRole)) {
        this.router.navigate(['/login']);

        return false;
      }

      return true;
    } else if (!isLoggedIn) {
        return true;
    } else {
        // Trying to access a page like login that is only accessible to logged out users
        this.router.navigate(['/school-management']);

        return false;
    }
  }
}
