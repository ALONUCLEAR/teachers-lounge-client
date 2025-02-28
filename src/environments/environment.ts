import { Config } from './types';
import { defaultEnv } from './default';

export const environment: Config = {
  ...defaultEnv,
  env: 'Prod',
  govUrl: 'https://data.gov.il/api/3/action/datastore_search',
  serverUrl: 'https://prod-server',
  encryptionKey: ''
};