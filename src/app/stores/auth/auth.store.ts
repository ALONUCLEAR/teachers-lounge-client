import { Injectable } from "@angular/core";
import { persistState, Store, StoreConfig } from "@datorama/akita";
import { UserRoles } from "src/app/api/server/types/permissions";
import { ActivityStatus } from "src/app/api/server/types/user";
import { decrypt, encrypt } from "src/app/utils/encryption";

export interface AuthState {
  id: string;
  govId: string;
  role: UserRoles;
  info: {
    firstName: string;
    lastName: string;
  };
  activityStatus: ActivityStatus;
 }

 export function createInitialState(): AuthState {
  return {
    id: '',
    govId: '',
    role: UserRoles.Base,
    info: {
      firstName: '',
      lastName: ''
    },
    activityStatus: ActivityStatus.Pending
  };
}

@Injectable()
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
    } catch {
      return {};
    }
  },
});