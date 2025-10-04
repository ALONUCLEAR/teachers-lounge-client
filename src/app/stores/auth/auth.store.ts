import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { persistState, Store, StoreConfig } from "@datorama/akita";
import { tryGettingUserByGovId } from "src/app/api/server/actions/user-actions";
import { hasPermissions, UserRoles } from "src/app/api/server/types/permissions";
import { ActivityStatus, User } from "src/app/api/server/types/user";
import { decrypt, encrypt } from "src/app/utils/encryption";

export type AuthState = Omit<User, 'password' | 'email'> & { selectedSchoolId?: string };

 export function createInitialState(): AuthState {
  return {
    id: '',
    govId: '',
    role: UserRoles.Base,
    info: {
      firstName: '',
      lastName: ''
    },
    activityStatus: ActivityStatus.Pending,
    associatedSchools: [],
    preferences: {}
  };
}

const SELECTED_SCHOOL_ID_KEY = 'selectedSchoolId';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth' })
export class AuthStore extends Store<AuthState> {
  constructor(private readonly router: Router) {
    super(createInitialState());
  }

  async logoutUser(): Promise<void> {
    this.updateUser(createInitialState());
    await this.router.navigate(['/login']);
  }

  updateUser(user: Partial<AuthState> & Pick<AuthState, 'associatedSchools' | 'role'>, selectedSchoolId?: string): void {
    const shouldHaveDefaultSchool = !hasPermissions(user.role, UserRoles.SuperAdmin) && user.associatedSchools?.length == 1;
    const schoolId = shouldHaveDefaultSchool ? user.associatedSchools[0] : selectedSchoolId;
    this.update({ ...user, selectedSchoolId: schoolId });
    this.selectSchool(schoolId);
  }

  public async refetchLoggedUser(): Promise<void> {
    const currentState = this.getValue();

    if (!currentState) {
      return;
    }

    const updatedUser = await tryGettingUserByGovId(currentState.govId);

    if (!updatedUser) {
      // since users can't be deleted(if no one messes with the db, this indicates a problem with connection to the server/db)
      return;
    }

    this.updateUser(updatedUser, currentState.selectedSchoolId);

    if (updatedUser.activityStatus === ActivityStatus.Active) {
      return;
    }

    // user is inactive so we want to log them out
    await this.logoutUser();
  }

  selectSchool(schoolId?: string): void {
    this.update({ selectedSchoolId: schoolId });

    if (schoolId) {
      sessionStorage.setItem(SELECTED_SCHOOL_ID_KEY, schoolId);
    } else {
      sessionStorage.removeItem(SELECTED_SCHOOL_ID_KEY);
    }
  }
}

persistState({
  key: 'auth',
  storage: localStorage,
  include: ['auth'],
  serialize: (state?: AuthState) => state ? encrypt(JSON.stringify(state)) : undefined,
  deserialize: (encrypedState?: string) => {
    try {
      return encrypedState && typeof encrypedState === 'string' ? JSON.parse(decrypt(encrypedState)) : {}
    } catch(error) {
      console.error(`Error decrypting state, was probably encrypted using a different key`);

      return {};
    }
  },
});