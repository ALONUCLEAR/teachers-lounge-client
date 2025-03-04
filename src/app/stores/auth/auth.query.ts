import { Injectable } from "@angular/core";
import { Query } from "@datorama/akita";
import { AuthState, AuthStore } from "./auth.store";

@Injectable()
export class AuthQuery extends Query<AuthState> {
  constructor(store: AuthStore) {
    super(store);
  }
}