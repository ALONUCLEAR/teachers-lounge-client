import { Injectable } from "@angular/core";
import { persistState, Store, StoreConfig } from "@datorama/akita";
import { UserRoles } from "src/app/api/server/types/permissions";
import { ActivityStatus, User } from "src/app/api/server/types/user";
import { decrypt, encrypt } from "src/app/utils/encryption";

export type AuthState = Omit<User, 'password' | 'email'>;

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
    associations: [],
    preferences: {}
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth' })
export class AuthStore extends Store<AuthState> {
  constructor() {
    super(createInitialState());
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