import { decrypt } from "src/app/utils/encryption";
import { AuthState } from "./auth.store";

export class LocalAuthService {
    public static getLoggedUser(): AuthState | null {
        const encrypedAuthStateJson = localStorage.getItem("auth");

        if (!encrypedAuthStateJson) {
            return null;
        }

        const authStateJson = decrypt(encrypedAuthStateJson);
    
        return JSON.parse(authStateJson).auth ?? null;
    }

    public static isLoggedIn(): boolean {
        return Boolean(this.getLoggedUser()?.id);
    }
}