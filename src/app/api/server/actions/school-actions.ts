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
    const response = await axios.post(`${schoolsUrl}/upsert`, schoolToUpsert, { headers: { userId }});

    if (response.status >= HttpStatusCode.BadRequest) {
        console.error(`Request to get all schools failed, returned with status ${response.status}`);

        return false;
    }

    return true;
}

export const tryDeleteSchool = async (userId: string, schoolId: string): Promise<boolean> => {
    const response = await axios.delete(`${schoolsUrl}/${schoolId}`, { headers: { userId } } );

    if (response.status >= HttpStatusCode.BadRequest) {
        console.error(`Request to get all schools failed, returned with status ${response.status}`);

        return false;
    }

    return response.data;
}