import { Injectable } from "@angular/core";
import Swal, { SweetAlertOptions, SweetAlertResult } from "sweetalert2";
import { AlertService, BaseStatus } from "./alert.service";

@Injectable()
export class PopupService extends AlertService<SweetAlertOptions, BaseStatus, Promise<SweetAlertResult>> {
    protected alert(text: string, status: BaseStatus, options?: SweetAlertOptions): Promise<SweetAlertResult> {
        return Swal.fire({ text, icon: status, ...this.getOptions(options) });
    }
}