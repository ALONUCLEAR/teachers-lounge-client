import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { trySendingCodeToUserByGovId } from 'src/app/api/server/actions/email-actions';
import { trySendingUserRecoveryRequest } from 'src/app/api/server/actions/user-status-actions';
import { PromptComponent } from 'src/app/components/ui/prompt/prompt.component';
import { PopupService } from 'src/app/services/popup.service';

@Component({
  selector: 'account-recovery',
  templateUrl: './account-recovery.component.html',
  styleUrls: ['./account-recovery.component.less'],
  providers: [],
})
export class AccountRecoveryComponent {
  isLoading = false;
  govIdControl = this.formBuilder.control<string>('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[\d]{8,10}$/)]});

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly popupService: PopupService,
    private readonly modalService: NgbModal,
  ) {}

  setGovId(id: string): void {
    this.govIdControl.setValue(id);
    this.govIdControl.markAsDirty();
  }

  // TODO: change it to work as it should (don't get the code back to the client)
  private async codeVerification(email: string): Promise<boolean> {
    this.isLoading = true;
    const verificationCode = await trySendingCodeToUserByGovId(email);
    const modalRef = this.modalService.open(PromptComponent);
    const instance: PromptComponent = modalRef.componentInstance;
    instance.promptTitle = `קוד אימות`;
    instance.promptText = `הכניסו את קוד האימות שקיבלתם במייל(${verificationCode})`;
    this.isLoading = false;
    const inputCode = await modalRef.result;

    if (!inputCode) {
      return false;
    }

    return inputCode === verificationCode;
  }

  async onSubmit(): Promise<void> {
    if (!this.govIdControl?.valid) {
      return;
    }

    const govId = this.govIdControl.value;

    try {
      if (!await this.codeVerification(govId)) {
        this.popupService.error(`קוד לא נכון`);
        this.isLoading = false;

        return;
      }

      this.isLoading = true;
      if (!await trySendingUserRecoveryRequest(govId)) {
        throw new Error(`Error sending user request to db`);
      }

      this.popupService.success(`המאשרים יקבלו התראה בקרוב`, { title: `ההודעה נשלחה בהצלחה` });
    } catch (e) {
      console.error(e);
      this.popupService.error(`שגיאה בשליחת הבקשה`);
    } finally {
      this.isLoading = false;
    }
  }
}