import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { ConfirmationPopupComponent, ConfirmationResult } from "../components/ui/confirmation-popup/confirmation-popup.component";
import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class ConfirmationService {
    constructor(private readonly modalService: NgbModal) { }

    async didConfirmAction(popupPrompt: string): Promise<boolean> {
        return ConfirmationService.didConfirmAction(this.modalService, popupPrompt);
    }

    /**For services and components that already need a modal for something else anyways */
    static async didConfirmAction(modalService: NgbModal, popupPrompt: string): Promise<boolean> {
        const modalRef = modalService.open(ConfirmationPopupComponent);
        const componentInstance: ConfirmationPopupComponent = modalRef.componentInstance;
        componentInstance.body = popupPrompt;
        let result = ConfirmationResult.CANCEL;

        try {
            result = await modalRef.result;
        } catch {
            // user clicked outside the modal to close
        }

        return result === ConfirmationResult.OK;
    }
}