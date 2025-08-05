import { Injectable } from '@angular/core';
import { EntityState, QueryEntity } from '@datorama/akita';
import { UserState, UserStore } from './user.store';
import { DisplayedUser, User } from 'src/app/api/server/types/user';
import { hasPermissions, UserRoles } from 'src/app/api/server/types/permissions';
import { map, Observable } from 'rxjs';

export const defaultDisplayMapper = (user: User): DisplayedUser => ({...user, display: `${user.info.firstName} ${user.info.lastName}(${user.govId})`});

@Injectable({providedIn: 'root'})
export class UserQuery extends QueryEntity<UserState, User> {
  constructor(store: UserStore) {
    super(store);
  }

  getAllDisplayed(displayMapper = defaultDisplayMapper): DisplayedUser[] {
    return this.getAll().map(displayMapper)
  }

  selectAllDisplayed(displayMapper = defaultDisplayMapper): Observable<DisplayedUser[]> {
    return this.selectAll().pipe(map(users => users.map(displayMapper)));
  }

  selectAllBySchool(schoolId: string): Observable<User[]> {
    return this.selectAll({
        asObject: false,
        filterBy: user => hasPermissions(user.role, UserRoles.SuperAdmin) || user.associatedSchools.includes(schoolId)
    });
  }

  selectAllDisplayedBySchool(schoolId: string, displayMapper = defaultDisplayMapper): Observable<DisplayedUser[]> {
    return this.selectAllBySchool(schoolId).pipe(map(users => users.map(displayMapper)));
  }
}