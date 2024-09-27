import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'drop-down',
  templateUrl: './drop-down.component.html',
  styleUrls: ['./drop-down.component.less'],
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
})
export class DropDownComponent<T> {
  @Input({ required: true }) entities: T[] = [];
  @Input({ required: true }) displayField?: keyof T;
}
