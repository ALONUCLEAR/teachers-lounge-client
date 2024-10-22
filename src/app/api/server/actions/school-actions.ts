import { environment } from "src/environments/environment";
import { School } from "../types/school";
import axios from "axios";

const schoolsUrl = `${environment.serverUrl}/schools`;

export const getAllSchools = async (): Promise<School[]> => {
    const response = await axios.get(schoolsUrl);

    if (response.status >= 300) {
        throw new Error(`Request to get all schools failed, returned with status ${response.status}`);
    }

    return response.data;
}

export const tryUpsertSchool = async (schoolToUpsert: School): Promise<boolean> => {
    const response = await axios.post(`${schoolsUrl}/upsert`, schoolToUpsert);

    if (response.status >= 300) {
        console.error(`Request to get all schools failed, returned with status ${response.status}`);

        return false;
    }

    return true;
}

export const tryDeleteSchool = async (schoolId: string): Promise<boolean> => {
    const response = await axios.delete(`${schoolsUrl}/${schoolId}`);

    if (response.status >= 300) {
        console.error(`Request to get all schools failed, returned with status ${response.status}`);

        return false;
    }

    return response.data;
}