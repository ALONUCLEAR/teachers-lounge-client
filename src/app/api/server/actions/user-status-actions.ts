import { environment } from "src/environments/environment";
import { UserRequest } from "../types/user";
import axios from "axios";

const requestsUrl = `${environment.serverUrl}/requests`;

export const getAllUserRequests = async (): Promise<UserRequest[]> => {
    const response = await axios.get(requestsUrl);

    if (response.status >= 400) {
        throw new Error(`Request to get all user requests failed, returned with status ${response.status}`);
    }

    return response.data;
}

export const trySendingUserRequest = async (userToCreate: UserRequest & { id: string }): Promise<boolean> => {
    const response = await axios.post(`${requestsUrl}`, userToCreate);

    if (response.status >= 300) {
        console.error(`Request to send a user creation request failed, returned with status ${response.status}`);

        return false;
    }

    return true;
}

export const trySendingUserRecoveryRequest = async (userGovId: string): Promise<boolean> => {
    const response = await axios.post(`${requestsUrl}/recovery/${userGovId}`);

    if (response.status >= 300) {
        console.error(`Request to send a user creation request failed, returned with status ${response.status}`);

        return false;
    }

    return true;
}

export const tryDeleteUserRequest = async (requestId: string): Promise<boolean> => {
    const response = await axios.delete(`${requestsUrl}/${requestId}`);

    if (response.status >= 300) {
        console.error(`Request to reject user creation requestFailed, returned with status ${response.status}`);

        return false;
    }

    return response.data;
}