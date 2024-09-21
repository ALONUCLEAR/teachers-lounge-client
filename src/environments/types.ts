type Environment = 'Dev' | 'Prod';

export interface Config {
  env: Environment;
  serverUrl: string;
}
