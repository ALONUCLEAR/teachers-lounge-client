import { Config } from './types';
import { defaultEnv } from './default';

const envValues: Partial<Config> = {
    env:'Dev',
    govUrl: 'https://data.gov.il/api/3/action/datastore_search',
    serverUrl: 'https://localhost:3000',
    encryptionKey: undefined
};

export const environment: Config = {
    ...defaultEnv,
    ...envValues
};