import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'drop-down',
  templateUrl: './drop-down.component.html',
  styleUrls: ['./drop-down.component.less'],
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
})
export class DropDownComponent<T> implements OnInit, OnChanges {
  @Input({ required: true }) entities: T[] = [];
  @Input({ required: true }) displayField?: keyof T;
  @Input() defaultValue?: T;
  @Input() placeholder?: string;
  @Input() allowReset = false;
  /** change this to trigger a reset */
  @Input() resetVar: any;
  @Output() onSelectionChanged = new EventEmitter<T>();

  selectedEntity?: T;

  ngOnInit(): void {
    this.selectedEntity = this.defaultValue;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.allowReset && changes['resetVar'] && this.defaultValue) {
      this.changeSelection(this.defaultValue);
    }
  }

  changeSelection(entity: T): void {
    this.selectedEntity = entity;
    this.onSelectionChanged.emit(entity);
  }
}
