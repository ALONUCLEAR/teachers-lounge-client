import { Injectable } from "@angular/core";
import Swal, { SweetAlertOptions } from "sweetalert2";
import { AlertService, BaseStatus } from "./alert.service";

@Injectable()
export class PopupService extends AlertService<SweetAlertOptions> {
    protected alert(text: string, status: BaseStatus, options?: SweetAlertOptions): void {
        Swal.fire({ text, icon: status, ...this.getOptions(options) });
    }
}