import { UserRoles } from "./permissions";

export enum ActivityStatus {
  Active = "Active",
  Blocked = "Blocked",
  Pending = "Pending"
}

export interface BaseUser {
  id?: string;
  govId: string;
  email: string;
  info: {
    firstName: string;
    lastName: string;
  };
  associatedSchools: string[];
}

export interface UserRequest extends BaseUser {
  password: string;
  confirmedPassword: string;
  requestedRole: keyof UserRoles;
  message?: string;
}

export type GenericUser = Omit<UserRequest, 'password' | 'confirmedPassword' | 'requestedRole' | 'id'>
                              & { id: string, activityStatus: ActivityStatus, role?: UserRoles};