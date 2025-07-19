import { Association } from "./association";
import { UserRoles } from "./permissions";

export enum ActivityStatus {
  Active = "Active",
  Blocked = "Blocked",
  Pending = "Pending"
}

export interface DisplayedStatus {
  name: string;
  value: ActivityStatus;
}

export const getHebrewwActivityStatus = (status: ActivityStatus): string => {
  switch(status) {
    case ActivityStatus.Active: return "פעיל";
    case ActivityStatus.Pending: return "ממתין לאישור";
    default: break;
  }

  return "חסום";
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

// TODO: make it import the actual UserPreferences type when it's implemented
type UserPreferences = Record<string, any>;

export type User = Omit<GenericUser, 'role' | 'message'> & { role: UserRoles, preferences: UserPreferences }

export type DisplayedUser = User & { display: string };