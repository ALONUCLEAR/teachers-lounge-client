import { Injectable } from "@angular/core";
import { persistState, Store, StoreConfig } from "@datorama/akita";
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
  constructor() {
    super(createInitialState());
  }

  logoutUser(): void {
    this.updateUser(createInitialState());
  }

  updateUser(user: Partial<AuthState> & Pick<AuthState, 'associatedSchools' | 'role'>): void {
    const shouldHaveDefaultSchool = !hasPermissions(user.role, UserRoles.SuperAdmin) && user.associatedSchools?.length == 1;
    const schoolId = shouldHaveDefaultSchool ? user.associatedSchools[0] : undefined;
    this.update({ ...user, selectedSchoolId: schoolId });
    this.selectSchool(schoolId);
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