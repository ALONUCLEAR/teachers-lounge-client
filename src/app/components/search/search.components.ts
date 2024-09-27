import { Component, ElementRef, EventEmitter, Input, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";
import { debounceTime, map, Observable, OperatorFunction } from "rxjs";

@Component({
  selector: 'search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less'],
  standalone: true,
  imports: [FormsModule, NgbTypeahead],
})
export class SearchComponent<T> implements OnInit {
  @Input({ required: true }) entities: T[] = [];
  @Input({ required: true }) displayField?: keyof T;
  @Input() initialValue?: T;
  @Output() onEntitySelected = new EventEmitter<T>();

  @ViewChild('entityInput') entityInput!: ElementRef<HTMLInputElement>;

  selectedEntity?: T;

  ngOnInit(): void {
      if (this.initialValue) {
        this.selectedEntity = this.initialValue;
      }
  }

  ngAfterViewInit(): void {
    const isValid = Boolean(this.selectedEntity);
    this.setValidity(isValid);

    if (!isValid) {
      this.onEntitySelected.emit(undefined);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entities']) {
      if (this.selectedEntity && !this.entities.includes(this.selectedEntity)) {
        this.selectedEntity = undefined;
      }

      this.setValidity(Boolean(this.selectedEntity));
    }
  }

  private setValidity(isValid: boolean): void {
    if (!this.entityInput?.nativeElement) {
      return;
    }

    this.entityInput.nativeElement.setCustomValidity(isValid ? '' : 'invalid');
  }

  search: OperatorFunction<string, readonly T[]> = (
    text$: Observable<string>
  ) =>
    text$.pipe(
      debounceTime(200),
      map((term) =>
        term === ''
          ? []
          : this.entities
              .filter(
                (v) => this.formatter(v).toLowerCase().indexOf(term.toLowerCase()) > -1
              )
              .slice(0, 10)
      )
    );

  formatter = (entity: T): string => {
    if (!entity) {
        return 'Error';
    }

    return `${entity[this.displayField!]}`;
  }

  selectionChanged(selection: T | string): void {
    if (typeof selection === 'string') {
        // a proper object wasn't selected yet
        this.setValidity(false);
        this.onEntitySelected.emit(undefined);

        return;
    }

    this.setValidity(true);
    this.selectedEntity = selection;
    this.onEntitySelected.emit(selection);
  }
}