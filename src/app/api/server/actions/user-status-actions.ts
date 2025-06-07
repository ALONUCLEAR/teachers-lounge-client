import { environment } from "src/environments/environment";
import { GenericUser, UserRequest } from "../types/user";
import axios, { HttpStatusCode } from "axios";
import { UserRoles } from "../types/permissions";

const requestsUrl = `${environment.serverUrl}/requests`;
const usersUrl = `${environment.serverUrl}/users`;

const genericUserRoleMapper = (user: GenericUser): GenericUser => ({
    ...user,
    role: user.role
        ? UserRoles[`${user.role}` as keyof typeof UserRoles]
        : undefined,
});

export const getAllUserRequests = async (requestingUserId: string): Promise<GenericUser[]> => {
    const response = await axios.get(requestsUrl, { headers: { userId: requestingUserId } });

    if (response.status >= HttpStatusCode.BadRequest) {
        throw new Error(`Request to get all user requests failed, returned with status ${response.status}`);
    }

    return response.data.map(genericUserRoleMapper);
}

export const getAllUsersByStatus = async (requestingUserId: string, areActive: boolean): Promise<GenericUser[]> => {
    const response = await axios.get(`${usersUrl}/active/${areActive}`, { headers: { userId: requestingUserId } });

    if (response.status >= HttpStatusCode.BadRequest) {
        throw new Error(`Request to get all blocked users failed, returned with status ${response.status}`);
    }

    return response.data.map(genericUserRoleMapper);
}

export const trySendingUserRequest = async (userToCreate: UserRequest & { id: string }): Promise<boolean> => {
    try {
        const response = await axios.post(`${requestsUrl}`, { ...userToCreate, role: userToCreate.requestedRole });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to send a user creation request failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const trySendingUserRecoveryRequest = async (userGovId: string): Promise<boolean> => {
    try {
        const response = await axios.post(`${requestsUrl}/recovery/${userGovId}`);

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to send a user creation request failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const tryUnblockUser = async (requestingUserId: string, userId: string): Promise<boolean> => {
    try {
        const response = await axios.post(`${usersUrl}/restore/${userId}`, undefined, { headers: { userId: requestingUserId } });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to unblock user failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const tryBlockUser = async (requestingUserId: string, userId: string): Promise<boolean> => {
    try {
        const response = await axios.post(`${usersUrl}/block/${userId}`, undefined, { headers: { userId: requestingUserId } });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to block user failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const createUserFromRequest = async (requestingUserId: string, requestId: string): Promise<number> => {
    try {
        const response = await axios.post(`${usersUrl}/from-request/${requestId}`, undefined, { headers: { userId: requestingUserId } });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            console.error(response.data);
        } else if (response.status > HttpStatusCode.Ok) {
            console.warn(response.data);
        }

        return response.status;
    } catch (error) {
        console.error(error);

        return HttpStatusCode.InternalServerError;
    }
}

export const tryLogin = async (govId: string, password: string): Promise<GenericUser | null> => {
    try {
        const response = await axios.post(`${usersUrl}/login`, { govId, password });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Login failed with status code ${response.status}`);
        }

        return response.data ? genericUserRoleMapper(response.data) : null;
    } catch (error) {
        console.error(error);

        return null;
    }
}

export const tryDeleteUserRequest = async (requestingUserId: string, requestId: string): Promise<boolean> => {
    try {
        const response = await axios.delete(`${requestsUrl}/${requestId}`, { headers: { userId: requestingUserId } });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to reject user creation requestFailed, returned with status ${response.status}`);
        }

        return response.data;
    } catch (error) {
        console.error(error);

        return false;
    }
}