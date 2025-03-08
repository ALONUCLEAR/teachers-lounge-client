export interface GovernmentData {
    id: number;
    name: string;
}

export interface Street extends GovernmentData {
    municipalityId: number;
}

export enum Resources {
    Municipalities = '5c78e9fa-c2e2-4771-93ff-7f400a12f7ba',
    Streets = '9ad3862c-8391-4b2f-84a4-2d4c68625f4b',
}