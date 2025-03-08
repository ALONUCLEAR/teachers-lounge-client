import { environment } from "src/environments/environment";
import axios from 'axios';
import { GovernmentData, Resources, Street } from "./types";

const getResourceQuery = (resourceId: string, limit: number, offset = 0) => {
    const offsetString = offset ? `&offset=${offset}` : '';

    return `${environment.govUrl}?resource_id=${resourceId}&limit=${limit}${offsetString}`;
}

const getAllEntities = async <T>(resource: Resources, converter: (record: any) => T, limit=32_000, offset = 0): Promise<T[]> => {
    const response = await axios.get(getResourceQuery(resource, limit, offset));
    const resourceName = Object.entries(Resources).find(([_, resourceId]) => resourceId === resource)?.[0];

    if (response.status >= 300) {
        throw new Error(`Request failed, got status code ${response.status} from gov when trying to fetch records for ${resourceName}`);
    }

    const records = response.data.result.records ?? [];

    return records.map(converter);
}

const getAllEntitiesPaginated = async <T>(resource: Resources, converter: (record: any) => T, limit=32_000): Promise<T[]> => {
    const fullList: T[] = [];
    let gotLastBatch = false;
    let offset = 0;

    do {
        const batch = await getAllEntities(resource, converter, limit, offset);
        offset += batch.length;
        fullList.push(...batch);
        gotLastBatch = batch.length < limit;
    } while(!gotLastBatch);

    return fullList;
}

const municipalityRecordToGovData = (record: any): GovernmentData => ({
    id: parseInt(record["סמל_ישוב"]),
    name: record["שם_ישוב"].trim(), 
});

export const getAllMunicipalities = async (): Promise<GovernmentData[]> => {
    return getAllEntitiesPaginated(Resources.Municipalities, municipalityRecordToGovData);
}

const streetRecordToStreet = (record: any): Street => ({
    id: parseInt(record["סמל_רחוב"]),
    name: record["שם_רחוב"].trim(),
    municipalityId: parseInt(record["סמל_ישוב"])
})

export const getAllStreets = async (): Promise<Street[]> => {
    return getAllEntitiesPaginated(Resources.Streets, streetRecordToStreet);
}