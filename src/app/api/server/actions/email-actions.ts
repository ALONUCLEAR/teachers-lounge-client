import axios, { HttpStatusCode } from "axios";
import { environment } from "src/environments/environment";
import { MailInput } from "../types/email";

const requestsUrl = `${environment.serverUrl}/emails`;
const codesUrl = `${environment.serverUrl}/codes`;

export const trySendingCodeToUser = async (govId: string, emailAddress: string): Promise<boolean> => {
    try {
        const response = await axios.post(`${requestsUrl}/send-code/to?govId=${govId}&emailAddress=${emailAddress}`);

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to send a user creation request failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const trySendingCodeToUserByGovId = async (govId: string): Promise<boolean> => {
    try {
        const response = await axios.post(`${requestsUrl}/send-code/to-id/${govId}`);

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to send a user creation request failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const isCodeVerified = async (govId: string, code: string): Promise<boolean> => {
    try {
        const response = await axios.get(`${codesUrl}/verify/${govId}?code=${code}`);

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to verify a code for the user ${govId} failed, returned with status ${response.status}`);
        }

        return response.data;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const trySendingMailTo = async (userId: string, emailAddress: string, mailInput: MailInput): Promise<boolean> => {
    try {
        const response = await axios.post(`${requestsUrl}/to/${emailAddress}`, mailInput, { headers: { userId } });

        if (response.status >= HttpStatusCode.MultipleChoices) {
            throw new Error(`Request to send an email failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}