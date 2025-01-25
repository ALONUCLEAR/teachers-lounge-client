import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConfirmationResult } from '../confirmation-popup/confirmation-popup.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.less'],
  imports: [FormsModule]
})
export class PromptComponent {
  @Input() promptTitle: string = '';
  @Input() promptText: string = '';

  promptInput: string = '';

  constructor(private readonly modal: NgbActiveModal) {}

  onAnswerSubmit(answer?: string): void {
    this.modal.close(answer ?? '');
  }
}
