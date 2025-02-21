import { UserRoles } from "./permissions";

export interface BaseUser {
  id?: string;
  govId: string;
  email: string;
}

export interface UserRequest extends BaseUser {
  info: {
      firstName: string;
      lastName: string;
  };
  password: string;
  confirmedPassword: string;
  requestedRole: keyof UserRoles;
  associatedSchools: string[];
  message?: string;
}

export type ApprovableUser = Omit<UserRequest, 'password' | 'confirmedPassword' | 'requestedRole' | 'id'>
                              & { id: string, role?: UserRoles};