import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'drop-down',
  templateUrl: './drop-down.component.html',
  styleUrls: ['./drop-down.component.less'],
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
})
export class DropDownComponent<T> implements OnInit {
  @Input({ required: true }) entities: T[] = [];
  @Input({ required: true }) displayField?: keyof T;
  @Input() defaultValue?: T;
  @Input() placeholder?: string;
  @Output() onSelectionChanged = new EventEmitter<T>();

  selectedEntity?: T;

  ngOnInit(): void {
      this.selectedEntity = this.defaultValue;
  }

  changeSelection(entity: T): void {
    this.selectedEntity = entity;
    this.onSelectionChanged.emit(entity);
  }
}
