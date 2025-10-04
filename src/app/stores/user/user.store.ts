import { Injectable } from "@angular/core";
import { EntityStore, StoreConfig } from "@datorama/akita";
import { User } from "src/app/api/server/types/user";

export type UserState = Omit<User, 'password'>;

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'users' })
export class UserStore extends EntityStore<UserState> {
  constructor() {
    super();
  }
}