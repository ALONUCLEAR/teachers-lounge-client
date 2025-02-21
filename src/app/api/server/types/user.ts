import { UserRoles } from "./permissions";

export interface UserRequest {
  govId: string;
  email: string;
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