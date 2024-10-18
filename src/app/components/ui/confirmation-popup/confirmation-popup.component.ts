import { AfterViewChecked, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export enum ConfirmationResult {
  OK = 'Ok',
  CANCEL = 'Cancel'
};

type Button = 'ok' | 'cancel'

@Component({
  selector: 'confirmation-popup',
  templateUrl: './confirmation-popup.component.html',
  styleUrls: ['./confirmation-popup.component.less'],
  standalone: true,
})
export class ConfirmationPopupComponent implements AfterViewChecked {
  @Input() title = "אתם בטוחים?";
  @Input() body?: string;
  @Input() autoSelectedButton: Button = 'cancel';

  @ViewChild('cancelButton') private readonly cancelButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('okButton') private readonly okButton?: ElementRef<HTMLButtonElement>;

  constructor(private modal: NgbActiveModal) {}

  private getAutoSelectButton(): HTMLButtonElement | undefined {
    return this[`${this.autoSelectedButton}Button`]?.nativeElement;
  }

  ngAfterViewChecked(): void {
    this.getAutoSelectButton()?.focus();
  }

  accept(): void {
    this.modal.close(ConfirmationResult.OK);
  }

  reject(): void {
    this.modal.close(ConfirmationResult.CANCEL);
  }
}