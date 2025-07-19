import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgbTypeahead } from "@ng-bootstrap/ng-bootstrap";
import { debounceTime, map, Observable, OperatorFunction } from "rxjs";
import { FuncPipe } from "src/app/pipes/func.pipe";

@Component({
  selector: 'search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less'],
  standalone: true,
  imports: [FormsModule, NgbTypeahead, CommonModule, FuncPipe],
})
export class SearchComponent<T> implements OnInit, OnChanges, AfterViewInit {
  @Input({ required: true }) entities: T[] = [];
  @Input({ required: true }) displayField?: keyof T;
  @Input() initialValues?: T[];
  @Input() markValidity = true;
  @Input() placeholder?: string;
  @Input() maxSuggestedElements = 10;
  @Input() isMultiple = false;
  @Input() allowReinitialization = false;
  @Output() onEntitySelected = new EventEmitter<T[]>();

  @ViewChild('entityInput') entityInput!: ElementRef<HTMLInputElement>;

  selectedEntities: T[] = [];

  ngOnInit(): void {
    if (this.initialValues) {
      this.selectedEntities = this.initialValues;
    }
  }

  ngAfterViewInit(): void {
    const isValid = this.selectedEntities.length > 0;
    this.setValidity(isValid);

    if (!isValid) {
      this.onEntitySelected.emit([]);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entities'] || changes['initialValues']) {
      if (this.displayField) {
        const selectedEntities = this.initialValues && this.allowReinitialization
          ? this.initialValues
          : this.selectedEntities;
        this.selectedEntities = selectedEntities.filter(selectedEntity =>
          this.entities.some(entity => entity[this.displayField!] === selectedEntity[this.displayField!])
        );
      }

      this.setValidity(this.selectedEntities.length > 0);
    }
  }

  private setValidity(isValid: boolean): void {
    if (!this.entityInput?.nativeElement || !this.markValidity) {
      return;
    }

    this.entityInput.nativeElement.setCustomValidity(isValid ? '' : 'invalid');
  }

  public onFocus(e: Event): void {
    e.stopPropagation();
    setTimeout(() => {
      const inputEvent: Event = new Event('input');
      e.target?.dispatchEvent(inputEvent);
    }, 0);
  }

  search: OperatorFunction<string, readonly T[]> = (
    text$: Observable<string>
  ) =>
    text$.pipe(
      debounceTime(200),
      map((term) =>
        this.entities
            .filter(
              entity => {
                const entityDisplay = this.formatter(entity).toLowerCase();
                const shouldShowBySelected = !this.isMultiple ||
                  !this.selectedEntities.some(selectedEntity => this.formatter(selectedEntity).toLowerCase() === entityDisplay);
                const shouldShowByTerm = term === '' || entityDisplay.indexOf(term.toLowerCase()) > -1;

                return shouldShowBySelected && shouldShowByTerm;
              }
            ).slice(0, this.maxSuggestedElements)
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
        this.setValidity(false);

        // if multiple, we don't want it to affect the rest, but if not, we do want to know our one value is now null
        // (eg if we use it in a filter, the filter should be empty)
        if (!this.isMultiple) {
          this.onEntitySelected.emit([]);
        }

        return;
    }

    this.setValidity(true);

    if (!this.isMultiple) {
      this.selectedEntities = [selection];
      this.onEntitySelected.emit(this.selectedEntities);
    } else if (!this.selectedEntities.includes(selection)) {
      this.selectedEntities.push(selection);
      this.onEntitySelected.emit(this.selectedEntities);
    }
  }

  removeSelection(entity: T): void {
    const index = this.selectedEntities.indexOf(entity);
    if (index > -1) {
      this.selectedEntities.splice(index, 1);
      this.onEntitySelected.emit(this.selectedEntities);
    }
  }
}