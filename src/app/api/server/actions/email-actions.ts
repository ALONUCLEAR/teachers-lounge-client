import axios, { HttpStatusCode } from "axios";
import { environment } from "src/environments/environment";

const requestsUrl = `${environment.serverUrl}/emails`;

// TODO: it shouldn't return the code to the user
export const trySendingCodeToUser = async (emailAddress: string): Promise<string> => {
    const response = await axios.post(`${requestsUrl}/send-code/to/${emailAddress}`);

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(`Request to send a user creation request failed, returned with status ${response.status}`);

        return `Error - ${response.data}`;
    }

    return response.data;
}

export const trySendingCodeToUserByGovId = async (govId: string): Promise<string> => {
    const response = await axios.post(`${requestsUrl}/send-code/to-id/${govId}`);

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(`Request to send a user creation request failed, returned with status ${response.status}`);

        return `Error - ${response.data}`;
    }

    return response.data;
}