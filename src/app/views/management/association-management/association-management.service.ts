import { Injectable } from "@angular/core";
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { isAssociationValid, tryDeleteAssociation, tryUpsertAssociation } from "src/app/api/server/actions/association-actions";
import { Association, AssociationType, getAssociationTypeKey } from "src/app/api/server/types/association";
import { School } from "src/app/api/server/types/school";
import { DisplayedUser } from "src/app/api/server/types/user";
import { ConfirmationPopupComponent, ConfirmationResult } from "src/app/components/ui/confirmation-popup/confirmation-popup.component";
import { PopupService } from "src/app/services/popup.service";
import { AuthQuery } from "src/app/stores/auth/auth.query";
import { AssociationCreationPopupComponent } from "./association-creation-popup/association-creation-popup.component";

export interface AssociationForm {
  name: FormControl<string>;
  associatedSchools: FormArray<FormControl<string>>;
  associatedUsers: FormArray<FormControl<string>>;
}

@Injectable({ providedIn: 'root' })
export class AssociationManagementService {
    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly popupService: PopupService,
        private readonly authQuery: AuthQuery,
        private readonly modalService: NgbModal,
    ) { }

    public createEmptyAssociationForm(schoolId: string): FormGroup<AssociationForm> {
        const associatedSchoolControls = [this.formBuilder.control(schoolId, { nonNullable: true })];

        return this.formBuilder.group<AssociationForm>({
            name: this.formBuilder.control<string>('', { nonNullable: true, validators: [Validators.required] }),
            associatedSchools: this.formBuilder.array(associatedSchoolControls, { validators: [Validators.required, Validators.minLength(1)] }),
            associatedUsers: this.formBuilder.array<FormControl<string>>([]),
        });
    }

    public createFilledAssociationForm(association?: Association): FormGroup<AssociationForm> {
        const associatedSchools = association?.associatedSchools?.filter(Boolean) ?? [];
        const associatedSchoolControls = associatedSchools.map(schoolId => this.formBuilder.control(schoolId, { nonNullable: true }));
        const associatedUsers = association?.associatedUsers?.filter(Boolean) ?? [];
        const associatedUserControls = associatedUsers.map(userId => this.formBuilder.control(userId, { nonNullable: true }));

        return this.formBuilder.group<AssociationForm>({
            name: this.formBuilder.control<string>(association?.name || '', { nonNullable: true, validators: [Validators.required] }),
            associatedSchools: this.formBuilder.array(associatedSchoolControls, { validators: [Validators.required, Validators.minLength(1)] }),
            associatedUsers: this.formBuilder.array(associatedUserControls),
        });
    }

    public static serializeForm(associationForm: FormGroup<AssociationForm>, type: AssociationType, associationId?: string): Association {
        return {
            id: associationId,
            name: associationForm.value.name!,
            associatedSchools: associationForm.value.associatedSchools!,
            associatedUsers: associationForm.value.associatedUsers ?? [],
            // We turn it into a string that would't be a real AssociationType but thankfully in typescript types are suggestions
            // And the value we're turning it into is really a valid value when it comes to the server
            type: getAssociationTypeKey(type) as AssociationType,
        };
    }

    public async upsertAssociation(
        association: Pick<Association, 'id' | 'type'>,
        associationForm: FormGroup<AssociationForm>,
        currentSchoolId: string,
        originalAssociationName?: string,
    ): Promise<boolean> {
        const actionName = `${association.id ? 'עדכון' : 'יצירת'} ${association.type}`;

        if (!await this.isFormValid(association, associationForm, currentSchoolId, originalAssociationName)) {
            return false;
        }

        const serializedAssociation = AssociationManagementService.serializeForm(associationForm!, association.type, association.id);

        if (await tryUpsertAssociation(this.authQuery.getUserId()!, serializedAssociation)) {
            this.popupService.success(`פעולת ${actionName} הסתיימה בהצלחה`);

            return true;
        }

        this.popupService.error(`שגיאה ב${actionName}`);

        return false;
    }

    private async isFormValid(
        association: Pick<Association, 'id' | 'type'>,
        associationForm: FormGroup<AssociationForm>,
        currentSchoolId: string,
        originalAssociationName?: string,
    ): Promise<boolean> {
        const actionName = `${association.id ? 'עדכון' : 'יצירת'} ${association.type}`;

        if (!associationForm.valid) {
            this.popupService.error(`שדות לא תקינים`, { title: `נסיון ${actionName} נכשל` });
            return false;
        }

        const serializedAssociation = AssociationManagementService.serializeForm(associationForm!, association.type, association.id);

        const newName = associationForm.value.name!;
        const associatedSchools = associationForm.value.associatedSchools!;

        if (originalAssociationName !== newName && await this.isDuplicateName(serializedAssociation)) {
            const errorMessage = `השם "${newName}" כבר שייך לנושא אחר ב${associatedSchools.length > 1 ? 'אחד מבתי הספר המשוייכים' : 'בית הספר הזה'}`;
            this.popupService.error(errorMessage, { title: `נסיון ${actionName} נכשל` });
            return false;
        }

        if (!associatedSchools.includes(currentSchoolId)) {
            const warningMessage = `הפעולה תנתק את בית הספר שלך מה${this.getTypename(association)} הזה.\nרק מנהל מבית ספר מקושר יוכל לקשר את בית הספר שלך חזרה.`;
            
            if (!await this.didConfirmAction(warningMessage)) {
                return false;
            }
        }

        return true;
    }

    private async isDuplicateName(serializedAssociation: Association): Promise<boolean> {
        return !await isAssociationValid(this.authQuery.getUserId()!, serializedAssociation); 
    }

    public async deleteAssociation(association: Association): Promise<boolean> {
        if (!association?.id) {
            return false;
        }

        const typename = this.getTypename(association);

        const generalConfirmationPrompt = `לחיצה על אישור תמחק את ה${typename}!`;
        const additionalSubjectWarning = `כל הפוסטים שמקושרים לנושא יהפכו לא זמינים לאלתר!`;
        const confirmationPrompt = generalConfirmationPrompt + 
            (association.type === AssociationType.Subject ? ` ${additionalSubjectWarning}` : '');

        if (!await this.didConfirmAction(confirmationPrompt)) {
            return false;
        }

        const actionName = `מחיקת ה${typename}`;

        if (await tryDeleteAssociation(this.authQuery.getUserId()!, association.id)) {
            this.popupService.success(`${actionName} הושלמה בהצלחה`);

            return true;
        }

        this.popupService.error(`${actionName} נכשלה. אנא נסו שוב במועד מאוחר יותר.`);

        return false;
    }

    private async didConfirmAction(popupPrompt: string): Promise<boolean> {
        const modalRef = this.modalService.open(ConfirmationPopupComponent);
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
    
    public async createAssociation(
        currentSchoolId: string,
        allSchools: School[],
        allUsers: DisplayedUser[],
        selectedAssociationType: AssociationType
    ): Promise<boolean> {
        const modalRef = this.modalService.open(AssociationCreationPopupComponent);
        const componentInstance: AssociationCreationPopupComponent = modalRef.componentInstance;
        componentInstance.currentSchoolId = currentSchoolId;
        componentInstance.allSchools = allSchools;
        componentInstance.allUsers = allUsers;
        componentInstance.selectedAssociationType = selectedAssociationType;
        let didSucceed: boolean = false;
    
        try {
          didSucceed = await modalRef.result;
        } catch {
          // user clicked outside the modal to close
        }

        return didSucceed;
    }

    private getTypename(association: Pick<Association, 'type'>): string {
        return association.type === AssociationType.Subject ? 'נושא' : 'שיוך';
    }
}