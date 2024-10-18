import { Injectable } from "@angular/core";
import Notify from 'simple-notify'

type NotifyStatus = "error" | "warning" | "success" | "info";
type NotifyType = "outline" | "filled";
type NotifyEffect = "fade" | "slide";
type NotifyPosition = 'left top' | 'top left' | 'right top' | 'top right' | 'left bottom' | 'bottom left' | 'right bottom' | 'bottom right' | 'center' | 'left y-center' | 'right y-center' | 'y-center left' | 'y-center right' | 'top x-center' | 'bottom x-center' | 'x-center top' | 'x-center bottom';

interface NotifyOptions {
    status?: NotifyStatus;
    type?: NotifyType;
    effect?: NotifyEffect;
    position?: NotifyPosition;
    title?: string;
    showIcon?: boolean;
    customIcon?: string;
    showCloseButton?: boolean;
    customClass?: string;
    speed?: number;
    autoclose?: boolean;
    autotimeout?: number;
    notificationsGap?: number;
    notificationsPadding?: number;
    customWrapper?: string;
}

@Injectable()
export class NotificationsService {
    private defaultOptions: NotifyOptions = {
        effect: 'slide',
        position: 'left top',
        type: 'outline',
        autotimeout: 3000
    };

    private getOptions(options?: NotifyOptions): NotifyOptions {
        if (!options) {
            return this.defaultOptions;
        }

        return { ...this.defaultOptions, ...options };
    }

    private notify(text: string, status: NotifyStatus, options?: NotifyOptions): void {
        new Notify({ text, status, ...this.getOptions(options)});
    }

    info(text: string, options?: NotifyOptions): void {
        this.notify(text, 'info', options);
    }

    success(text: string, options?: NotifyOptions): void {
        this.notify(text, 'success', options);
    }

    error(text: string, options?: NotifyOptions): void {
        this.notify(text, 'error', options);
    }

    warn(text: string, options?: NotifyOptions): void {
        this.notify(text, 'warning', options);
    }
}