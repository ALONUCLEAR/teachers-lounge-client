export interface School {
    id: string;
    name: string;
    municipality: GovernmentData,
    address: {
        street: GovernmentData,
        houseNumber: number,
    }
}

export interface GovernmentData {
    id: string;
    fk: number;
    name: string;
}