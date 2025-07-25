const optional = (val) => val ? `'${val}'` : `undefined` 

const trimLines = (input) => input.split('\n').map(line => line.trim()).join('\n');

const setEnv = () => {
    const writeFile = require('fs').writeFile;
    const targetPath = './src/environments/environment.ts';
    require('dotenv').config();

    const envConfigFile = trimLines(`import { Config } from './types';
    import { defaultEnv } from './default';

    const envValues: Partial<Config> = {
      env: ${optional(process.env['ENV'])},
      govUrl: ${optional(process.env['GOV_URL'])},
      serverUrl: ${optional(process.env['SERVER_URL'])},
      encryptionKey: ${optional(process.env['ENCRYPTION_KEY'])}
    };

    export const environment: Config = {
      ...defaultEnv,
      ...envValues
    };`);

    writeFile(targetPath, envConfigFile, (err) => {
      if (err) {
        console.error("Error writing environment file", err);
        throw err;
      } else {
        console.log(`Angular environment.ts file generated correctly at ${targetPath} \n`);
      }
    });
  };
  
setEnv();
  