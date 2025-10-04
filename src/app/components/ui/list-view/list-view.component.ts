import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { FuncPipe } from 'src/app/pipes/func.pipe';

export interface EntityGroup<Entity extends Record<string, any>> {
  title: string;
  entities: Entity[];
}

@Component({
  selector: 'list-view',
  standalone: true,
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.less'],
  imports: [CommonModule, FormsModule, FuncPipe, NgbAccordionModule],
})
export class ListViewComponent<Entity extends Record<string, any>> implements OnChanges {
  @Input({ required: true }) data: EntityGroup<Entity>[] = [];
  @Input({ required: true }) displayMapper!: (entity: Entity) => string;
  @Input({ required: true }) template!: TemplateRef<any>;
  @Input() entityTrackBy: (entity?: Entity) => string = (entity?: Entity) => JSON.stringify(entity);
  @Input() selectedEntityId?: string;
  @Input() showCountInTitle = true;
  @Input() creationFunction?: (groupTitle: string) => Promise<void>;
  @Output() onEntitySelected = new EventEmitter<string | undefined>();

  selectedEntity?: Entity;
  searchTerm = '';
  filteredData: EntityGroup<Entity>[] = [];
  shouldBeClose: Record<string, boolean> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['displayMapper']) {
      this.filteredData = this.getFilteredData();

      this.filteredData.forEach(group => {
        this.shouldBeClose[group.title] = !group.entities.length;
      });
    }

    if (changes['data'] || changes['selectedEntityId']) {
      this.selectedEntity = this.getAllEntities().find(entity => this.entityTrackBy(entity) === this.selectedEntityId);
    }
  }

  private getAllEntities(): Entity[] {
    return this.data.flatMap(group => group.entities);
  }

  private getFilteredData(): EntityGroup<Entity>[] {
    const search = this.searchTerm.toLowerCase();

    return this.data.map(({ entities, title }) => ({
      title,
      entities: entities.filter((entity) =>
        this.displayMapper(entity).toLowerCase().includes(search)
      ),
    }));
  }

  onSearchChanged(): void {
    this.filteredData = this.getFilteredData();
  }

  selectEntity(entity?: Entity): void {
    this.onEntitySelected.emit(this.entityTrackBy(entity));
  }

  async createEntity(group: EntityGroup<Entity>, click: Event): Promise<void> {
    click.stopPropagation();

    if (!this.creationFunction) {
      console.error(`Add button accessible even without function!`);
      return;
    }

    await this.creationFunction(group.title);
  }

  trackByGroup(_: number, group: EntityGroup<Entity>): string {
    return group.title;
  }

  trackByEntity(_: number, entity: Entity): string {
    if (!this.entityTrackBy) {
      return JSON.stringify(entity);
    }

    return this.entityTrackBy(entity);
  }
}
