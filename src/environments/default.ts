import { Config } from './types';

export const defaultEnv: Config = {
  env: 'Dev',
  govUrl: 'https://data.gov.il/api/3/action/datastore_search',
  serverUrl: 'https://localhost:3000',
  encryptionKey: 'missing-key'
};