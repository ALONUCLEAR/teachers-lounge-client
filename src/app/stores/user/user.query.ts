import { Injectable } from '@angular/core';
import { EntityState, QueryEntity } from '@datorama/akita';
import { UserState, UserStore } from './user.store';
import { User } from 'src/app/api/server/types/user';
import { hasPermissions, UserRoles } from 'src/app/api/server/types/permissions';
import { Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class UserQuery extends QueryEntity<UserState, User> {
  constructor(store: UserStore) {
    super(store);
  }

  selectAllBySchool(schoolId: string): Observable<User[]> {
    return this.selectAll({
        asObject: false,
        filterBy: user => hasPermissions(user.role, UserRoles.SuperAdmin) || user.associatedSchools.includes(schoolId)
    });
  }
}