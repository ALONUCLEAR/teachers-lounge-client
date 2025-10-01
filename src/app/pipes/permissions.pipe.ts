import { Pipe, PipeTransform } from '@angular/core';
import { GenericUser } from '../api/server/types/user';
import { hasPermissions, UserRoles } from '../api/server/types/permissions';

@Pipe({
  name: 'permissions',
  standalone: true,
})
export class PermissionsPipe implements PipeTransform {
    transform(user: GenericUser, requiredPermission: UserRoles): boolean
    transform(userRole: UserRoles, requiredPermission: UserRoles): boolean
    transform(userOrRole: GenericUser | UserRoles, requiredPermission: UserRoles): boolean {
        if (typeof userOrRole === 'object') {
            return Boolean(userOrRole.role) && hasPermissions(userOrRole.role!, requiredPermission);
        }

        return hasPermissions(userOrRole, requiredPermission);
  }
}