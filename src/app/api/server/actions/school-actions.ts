import { environment } from "src/environments/environment";
import { School } from "../types/school";
import axios, { HttpStatusCode } from "axios";

const schoolsUrl = `${environment.serverUrl}/schools`;

export const getAllSchools = async (): Promise<School[]> => {
    const response = await axios.get(schoolsUrl);

    if (response.status >= HttpStatusCode.BadRequest) {
        throw new Error(`Request to get all schools failed, returned with status ${response.status}`);
    }

    return response.data;
}

export const tryUpsertSchool = async (userId: string, schoolToUpsert: School): Promise<boolean> => {
    try {
        const response = await axios.post(`${schoolsUrl}/upsert`, schoolToUpsert, { headers: { userId } });

        if (response.status >= HttpStatusCode.BadRequest) {
            throw new Error(`Request to get all schools failed, returned with status ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

export const tryDeleteSchool = async (userId: string, schoolId: string): Promise<boolean> => {
    try {
        const response = await axios.delete(`${schoolsUrl}/${schoolId}`, { headers: { userId } });

        if (response.status >= HttpStatusCode.BadRequest) {
            throw new Error(`Request to get all schools failed, returned with status ${response.status}`);
        }

        return response.data;
    } catch (error) {
        console.error(error);

        return false;
    }
}