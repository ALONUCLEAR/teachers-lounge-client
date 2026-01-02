import { Config } from './types';
import { defaultEnv } from './default';

const envValues: Partial<Config> = {
env: 'Dev',
govUrl: 'https://data.gov.il/api/3/action/datastore_search',
serverUrl: 'https://teachers-lounge-server.onrender.com',
encryptionKey: 'development-only'
};

export const environment: Config = {
...defaultEnv,
...envValues
};