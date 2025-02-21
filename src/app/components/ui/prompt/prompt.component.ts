import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

enum AnswerFieldType {
  INPUT = "INPUT",
  TEXTAREA = "TEXTAREA"
};

@Component({
  standalone: true,
  selector: 'prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.less'],
  imports: [CommonModule, FormsModule]
})
export class PromptComponent {
  @Input() promptTitle: string = '';
  @Input() promptText: string = '';
  @Input() isAnswerRequried = true;
  @Input() answerFieldType: AnswerFieldType = AnswerFieldType.INPUT;

  promptInput: string = '';
  readonly AnswerFieldTypeEnum = AnswerFieldType;

  constructor(private readonly modal: NgbActiveModal) {}

  onAnswerSubmit(answer?: string): void {
    if (!answer && this.isAnswerRequried) {
      return;
    }

    this.modal.close(answer);
  }

  onCancel(): void {
    this.modal.close();
  }
}
