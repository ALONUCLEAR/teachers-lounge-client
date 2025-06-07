import axios, { HttpStatusCode } from "axios";
import { environment } from "src/environments/environment";
import { MailInput } from "../types/email";

const requestsUrl = `${environment.serverUrl}/emails`;

// TODO: it shouldn't return the code to the user
export const trySendingCodeToUser = async (emailAddress: string): Promise<string> => {
    try {
        const response = await axios.post(`${requestsUrl}/send-code/to/${emailAddress}`);

        if (response.status >= HttpStatusCode.MultipleChoices) {
            console.error(`Request to send a user creation request failed, returned with status ${response.status}`);

            return `Error - ${response.data}`;
        }
        return response.data;
    } catch (error) {
        console.error(error);

        return `Error - ${error}`;
    }
}

export const trySendingCodeToUserByGovId = async (govId: string): Promise<string> => {
    try {
        const response = await axios.post(`${requestsUrl}/send-code/to-id/${govId}`);

        if (response.status >= HttpStatusCode.MultipleChoices) {
            console.error(`Request to send a user creation request failed, returned with status ${response.status}`);

            return `Error - ${response.data}`;
        }

        return response.data;
    } catch (error) {
        console.error(error);

        return `Error - ${error}`;
    }
}

export const trySendingMailTo = async (emailAddress: string, mailInput: MailInput): Promise<boolean> => {
    try {
        const response = await axios.post(`${requestsUrl}/to/${emailAddress}`, mailInput);

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to send an email failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}