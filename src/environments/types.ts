type Environment = 'Dev' | 'Prod';

export interface Config {
  env: Environment;
  govUrl: string;
  serverUrl: string;
  encryptionKey: string;
}
