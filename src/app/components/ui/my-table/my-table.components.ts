import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { cloneDeep } from 'lodash';
import {
  ConfirmationPopupComponent,
  ConfirmationResult,
} from '../confirmation-popup/confirmation-popup.component';
import { NotificationsService } from 'src/app/services/notifications.service';

export enum FieldType {
  READONLY = 'READ ONLY',
  EDITABLE = 'EDITABLE',
  ACTION = 'ACTION'
}

export interface ActionEvent<Entity> {
  action: ActionType,
  entity?: Entity,
  editedEntity?: Entity
}

export interface InputAction {
  action: ActionType,
  icon: ActionIcon;
}

export interface Action {
  action: ActionType,
  iconClasses: string;
}

export enum ActionType {
  SAVE = 'SAVE',
  DELETE = 'DELETE',
  APPROVE_USER = 'APPROVE_USER',
}

interface BaseField {
  title: string;
};

export interface PropertyField<Entity> extends BaseField {
  type: FieldType.READONLY | FieldType.EDITABLE,
  mapper: (entity: Entity) => string
}

interface ActionField extends BaseField {
  type: FieldType.ACTION,
}

export type Field<Entity> = ActionField | PropertyField<Entity>;

export enum ActionIcon {
  DELETE = "DELETE",
  UNLINK = "UNLINK",
  APPROVE_USER = "APPROVE",
  REJECT_USER = "REJECT"
}

@Component({
  selector: 'my-table',
  templateUrl: './my-table.component.html',
  styleUrls: ['./my-table.component.less'],
  standalone: true,
  imports: [FormsModule, CommonModule, NgbTooltipModule],
  providers: [NotificationsService],
})
export class MyTableComponent<Entity extends { id: string }> implements OnChanges {
  @Input({ required: true }) fields: PropertyField<Entity>[] = [];
  @Input({ required: true }) entities: Entity[] = [];
  @Input() editedRowTemplate?: TemplateRef<any>;
  @Input() emptyEntity?: Entity;
  @Input() allowEdit = true;
  @Input() deleteIcon = ActionIcon.DELETE;
  @Input() additionalActionInputs: InputAction[] = [];
  @Input() filterTemplate?: TemplateRef<any>;
  @Input() inputEditedEntityIndex = -1;
  @Input() midEditSwapAlert =
    'לערוך את השורה הזו יאפס את השינויים שלא שמרתם על השורה הקודמת';
  @Output() onEditedEntityChanged = new EventEmitter<{entity: Entity, index: number}>();
  @Output() onAction = new EventEmitter<ActionEvent<Entity>>();
  @Output() onFiltersCleared = new EventEmitter<void>();

  editedEntity?: Entity & { displayId: string };
  displayedFields: Field<Entity>[] = [];
  copiedEntities: Entity[] = [];
  mappedEntities: Record<string, string>[] = [];

  additionalActions: Action[] = [];

  private readonly ACTION_FIELDS: ActionField[] = ['פעולות', ''].map(title => ({title, type: FieldType.ACTION}));
  readonly ActionType = ActionType;
  deleteIconClasses = this.getIconClasses(this.deleteIcon);

  constructor(
    private readonly modalService: NgbModal,
    private readonly notificationsService: NotificationsService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes[`fields`]) {
      this.initTable();
    }

    if (changes['additionalActionInputs']) {
      this.additionalActions = this.additionalActionInputs.map(
        action => ({
          action: action.action,
          iconClasses: this.getIconClasses(action.icon)
        })
      );
    }

    if (changes['allowEdit'] || changes['editedRowTemplate'] || changes['emptyEntity']) {
      if (this.allowEdit && (!this.editedRowTemplate || !this.emptyEntity)) {
        this.notificationsService.error(`ישות ריקה או טמפלייט שורת עריכה`, { title: 'אחד משדות החובה הבאים לא הוזן' });
      }
    }

    if (changes[`inputEditedEntityIndex`]) {
      const editedEntity = this.copiedEntities[this.inputEditedEntityIndex];
      this.editedEntity = editedEntity
        ? { ...editedEntity, displayId: this.mapIdToDisplay(editedEntity) }
        : undefined;
    }

    if (changes[`fields`] || changes[`entities`]) {
      this.initMappedEntities(this.entities);
    }

    if (changes['deleteIcon']) {
      this.deleteIconClasses = this.getIconClasses(this.deleteIcon);
    }
  }

  private getIconClasses(deleteIcon: ActionIcon): string {
    switch(deleteIcon) {
      case ActionIcon.UNLINK:
        return "fa-solid fa-link-slash";
      case ActionIcon.APPROVE_USER:
        return "fa-solid fa-user-check";
      case ActionIcon.REJECT_USER:
        return "fa-solid fa-user-slash";
      default: break;
    }

    return "fa-solid fa-trash";
  }

  private mapIdToDisplay(entity: Entity): string {
    return this.fields.find(field => field.title === "מזהה")!.mapper(entity);
  
  }
  private initTable(): void {
    this.displayedFields = [...this.fields, ...this.ACTION_FIELDS];
  }

  private initMappedEntities(entities: Entity[]): void {
    this.copiedEntities = cloneDeep(entities);

    if (this.editedEntity && !this.copiedEntities.some(({id}) => id === this.editedEntity!.id)) {
      this.copiedEntities.unshift(this.editedEntity);
    }

    this.mappedEntities = this.copiedEntities.map(entity => {
      const mappedEntity: Record<string, string> = {};
      this.fields.forEach(field => {
        mappedEntity[field.title] = field.mapper(entity);
      });

      return mappedEntity;
    });
  }

  async editEntity(entity: Entity, index: number): Promise<void> {
    if (this.editedEntity && this.editedEntity.id !== entity.id) {
      const modalRef = this.modalService.open(ConfirmationPopupComponent);
      const componentInstance: ConfirmationPopupComponent = modalRef.componentInstance;
      componentInstance.body = this.midEditSwapAlert;
      let result = ConfirmationResult.CANCEL;

      try {
        result = await modalRef.result;
      } catch {
        // user clicked outside the modal to close
      }

      if (result !== ConfirmationResult.OK) {
        return;
      }
    }

    this.editedEntity = cloneDeep({ ...entity, displayId: this.mapIdToDisplay(entity) });
    this.onEditedEntityChanged.emit({ entity: this.editedEntity, index });
  }

  addEntity(): void {
    if (!this.allowEdit) {
      // allow parent components to have a custom add function if it's not editable
      this.onAction.emit({ action: ActionType.SAVE });
      return;
    }

    if (this.editedEntity || !this.emptyEntity) {
      return;
    }

    this.copiedEntities.unshift(this.emptyEntity);
    this.initMappedEntities(this.copiedEntities);
    this.editedEntity = {...this.emptyEntity, displayId: this.mapIdToDisplay(this.emptyEntity) };
    this.onEditedEntityChanged.emit({ entity: this.editedEntity, index: 0 });
  }

  fireCustomAction({ action }: Action, entity?: Entity): void {
    this.onAction.emit({ action, editedEntity: this.editedEntity, entity: entity });
  }

  saveEntity(entity: Entity): void {
    const entityToEdit = this.copiedEntities.find(({ id }) => id === entity?.id);
    this.onAction.emit({ action: ActionType.SAVE, entity, editedEntity: entityToEdit });
  }

  trackById(index: number, mappedEntity: Record<string, string>): string {
    return `index-${index};entity-${mappedEntity['id']}`;
  }
}