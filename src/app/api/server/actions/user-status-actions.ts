import { environment } from "src/environments/environment";
import { GenericUser, UserRequest } from "../types/user";
import axios, { HttpStatusCode } from "axios";
import { UserRoles } from "../types/permissions";

const requestsUrl = `${environment.serverUrl}/requests`;
const usersUrl = `${environment.serverUrl}/users`;

const approvableUserRoleMapper = (user: GenericUser) => ({
  ...user,
  role: user.role
    ? UserRoles[`${user.role}` as keyof typeof UserRoles]
    : undefined,
});

export const getAllUserRequests = async (): Promise<GenericUser[]> => {
    const response = await axios.get(requestsUrl);

    if (response.status >= HttpStatusCode.BadRequest) {
        throw new Error(`Request to get all user requests failed, returned with status ${response.status}`);
    }

    return response.data.map(approvableUserRoleMapper);
}

export const getAllUsersByStatus = async (areActive: boolean): Promise<GenericUser[]> => {
    const response = await axios.get(`${usersUrl}/active/${areActive}`);

    if (response.status >= HttpStatusCode.BadRequest) {
        throw new Error(`Request to get all blocked users failed, returned with status ${response.status}`);
    }

    return response.data.map(approvableUserRoleMapper);
}

export const trySendingUserRequest = async (userToCreate: UserRequest & { id: string }): Promise<boolean> => {
    const response = await axios.post(`${requestsUrl}`, { ...userToCreate, role: userToCreate.requestedRole });

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(`Request to send a user creation request failed, returned with status ${response.status}`);

        return false;
    }

    return true;
}

export const trySendingUserRecoveryRequest = async (userGovId: string): Promise<boolean> => {
    const response = await axios.post(`${requestsUrl}/recovery/${userGovId}`);

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(`Request to send a user creation request failed, returned with status ${response.status}`);

        return false;
    }

    return true;
}

export const trySendingForgotPasswordRequest = async (userId: string, newPassword: string): Promise<boolean> => {
    const response = await axios.post(`${usersUrl}/updatePassword`, {userId, newPassword});

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(`Request to send a password change request failed, returned with status ${response.status}`);

        return false;
    }

    return true;
}

export const tryUnblockUser = async (userId: string): Promise<boolean> => {
    const response = await axios.post(`${usersUrl}/restore/${userId}`);

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(response.status);

        return false;
    }

    return true;
}

export const tryBlockUser = async (userId: string): Promise<boolean> => {
    const response = await axios.post(`${usersUrl}/block/${userId}`);

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(response.status);

        return false;
    }

    return true;
}

export const createUserFromRequest = async (requestId: string): Promise<number> => {
    const response = await axios.post(`${usersUrl}/from-request/${requestId}`);

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(response.data);
    } else if (response.status > HttpStatusCode.Ok) {
        console.warn(response.data);
    }

    return response.status;
}

export const tryLogin = async(govId: string, password: string): Promise<GenericUser | null> => {
    const response = await axios.post(`${usersUrl}/login`, { govId, password });

    if (response.status >= HttpStatusCode.MultipleChoices) {
        return null;
    }

    return response.data;
}

export const tryDeleteUserRequest = async (requestId: string): Promise<boolean> => {
    const response = await axios.delete(`${requestsUrl}/${requestId}`);

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(`Request to reject user creation requestFailed, returned with status ${response.status}`);

        return false;
    }

    return response.data;
}

//TEMP
export const tryGettingUserIdByGovId = async (govId: string): Promise<string | undefined> => {
    const response = await axios.get(`${usersUrl}/${govId}`);

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(`Request to reject user creation requestFailed, returned with status ${response.status}`);

        return undefined;
    }

    return response.data;
}