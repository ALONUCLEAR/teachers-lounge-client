import { AfterViewChecked, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export enum ConfirmationResult {
  OK = 'Ok',
  CANCEL = 'Cancel'
};

@Component({
  selector: 'confirmation-popup',
  templateUrl: './confirmation-popup.component.html',
  styleUrls: ['./confirmation-popup.component.less'],
  standalone: true,
})
export class ConfirmationPopupComponent {
  @Input() title = "אתם בטוחים?";
  @Input() body?: string;

  constructor(private readonly modal: NgbActiveModal) {}

  accept(): void {
    this.modal.close(ConfirmationResult.OK);
  }

  reject(): void {
    this.modal.close(ConfirmationResult.CANCEL);
  }
}