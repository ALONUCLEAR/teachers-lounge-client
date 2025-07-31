import { Injectable } from "@angular/core";
import { UserStore } from "./user.store";
import { getAllUsersByStatus } from "src/app/api/server/actions/user-actions";
import { AuthQuery } from "../auth/auth.query";

@Injectable({providedIn: 'root'})
export class UserService {
    private isRequesting = false;
    readonly POLLING_INTERVAL_MS = 5000;
    interval?: number;

    constructor(
        private readonly userStore: UserStore,
        private readonly authQuery: AuthQuery,
    ) { }

    async poll$(pollingInterval = this.POLLING_INTERVAL_MS): Promise<void> {
        await this.pollUsers();

        this.stopPolling();

        this.interval = window.setInterval(() => this.pollUsers(), pollingInterval);
    }

    stopPolling(): void {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    private async pollUsers(): Promise<void> {
        const requestingUserId = this.authQuery.getUserId();

        if (!requestingUserId || this.isRequesting) {
            return;
        }

        this.isRequesting = true;

        try {
            const allUsers = await getAllUsersByStatus(requestingUserId, true);
            this.userStore.set(allUsers);
        } catch (e) {
            console.error(e);
        }

        this.isRequesting = false;
    }
}