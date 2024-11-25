import { GovernmentData, Street } from "../../gov/types";

export interface School {
    id: string;
    name: string;
    municipality: GovernmentData,
    address: {
        street: Street,
        houseNumber: number,
    }
}