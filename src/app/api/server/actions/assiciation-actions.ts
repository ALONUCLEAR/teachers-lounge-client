import axios, { HttpStatusCode } from "axios";
import { environment } from "src/environments/environment";
import { Association, AssociationType, getAssociationTypeKey } from "../types/association";

const associationsUrl = `${environment.serverUrl}/associations`;

const associationValue = (key: string) => AssociationType[key as keyof typeof AssociationType];

const associationMapper = (association: Association): Association => ({
    ...association,
    type: associationValue(`${association.type}`)
});

export const getAllAssociations = async (requestingUserId: string): Promise<Association[]> => {
    const response = await axios.get(associationsUrl, { headers: { userId: requestingUserId} });

    if (response.status >= HttpStatusCode.BadRequest) {
        throw new Error(`Request to get all associations failed, returned with status ${response.status}`);
    }

    return response.data.map(associationMapper);
}

export const getAssociationsByType = async (requestingUserId: string, associationType: AssociationType, schoolId: string): Promise<Association[]> => {
    const typeName = getAssociationTypeKey(associationType) as string;

    if (!typeName) {
        throw new Error(`Invalid type ${associationType}`);
    }

    const response = await axios.get(`${associationsUrl}/type/${typeName}/from/${schoolId}`, { headers: { userId: requestingUserId }});

    if (response.status >= HttpStatusCode.BadRequest) {
        throw new Error(`Request to get all associations of type ${typeName} from school ${schoolId} failed, returned with status ${response.status}`);
    }

    return response.data.map(associationMapper);
}

export const tryUpsertAssociation = async (requestingUserId: string, association: Association): Promise<boolean> => {
    const response = await axios.post(`${associationsUrl}`, association, { headers: { userId: requestingUserId } });

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(`Request to upsert association failed, returned with status ${response.status}`);

        return false;
    }

    return true;
}

export const tryDeleteAssociation = async (requestingUserId: string, associationId: string): Promise<boolean> => {
    const response = await axios.delete(`${associationsUrl}/${associationId}`, { headers: { userId: requestingUserId } });

    if (response.status >= HttpStatusCode.MultipleChoices) {
        console.error(`Request to delete association failed, returned with status ${response.status}`);

        return false;
    }

    return response.data;
}