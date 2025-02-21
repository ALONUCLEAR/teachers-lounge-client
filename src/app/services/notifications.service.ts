import { Injectable } from "@angular/core";
import Notify from 'simple-notify'
import { AlertService, BaseStatus } from "./alert.service";

type NotifyType = "outline" | "filled";
type NotifyEffect = "fade" | "slide";
type NotifyPosition = 'left top' | 'top left' | 'right top' | 'top right' | 'left bottom' | 'bottom left' | 'right bottom' | 'bottom right' | 'center' | 'left y-center' | 'right y-center' | 'y-center left' | 'y-center right' | 'top x-center' | 'bottom x-center' | 'x-center top' | 'x-center bottom';

interface NotifyOptions {
    status?: BaseStatus;
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
export class NotificationsService extends AlertService<NotifyOptions> {
    protected override defaultOptions: NotifyOptions = {
        effect: 'slide',
        position: 'left top',
        type: 'outline',
        autotimeout: 3000
    };

    protected alert(text: string, status: BaseStatus, options?: NotifyOptions): void {
        new Notify({ text, status, ...this.getOptions(options)});
    }
}