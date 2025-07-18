import { Injectable } from "@angular/core";
import { Query } from "@datorama/akita";
import { AuthState, AuthStore } from "./auth.store";

@Injectable({providedIn: 'root'})
export class AuthQuery extends Query<AuthState> {
  constructor(store: AuthStore) {
    super(store);
  }

  public getUserId(): string | undefined {
    return this.getValue()?.id;
  }

  public getSelectedSchoolId(): string | undefined {
    return this.getValue()?.selectedSchoolId ?? sessionStorage.getItem('selectedSchoolId') ?? undefined;
  }
}