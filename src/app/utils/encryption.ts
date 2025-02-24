import * as CryptoJS from 'crypto-js';
import { environment } from "src/environments/environment";

const encryptionKey = "Alon";

export const encrypt = (value: string): string => {
    return CryptoJS.AES.encrypt(value, encryptionKey).toString();
}

export const decrypt = (value: string): string => {
    return CryptoJS.AES.decrypt(value, encryptionKey).toString(CryptoJS.enc.Utf8);
}