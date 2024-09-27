import { Injectable } from "@angular/core";
import { EntityState, EntityStore, StoreConfig } from "@datorama/akita";
import { getAllStreets } from "src/app/api/gov/get-entities";
import { Street } from "src/app/api/gov/types";

export interface StreetsState extends EntityState<Street, number> { }

@Injectable()
@StoreConfig({ name: 'municipalities' })
export class StreetsStore extends EntityStore<StreetsState> {
  constructor() {
    super();
  }

  async initiaize(): Promise<void> {
    this.setLoading(true);
    const streets = await getAllStreets();
    this.set(streets);
    this.setLoading(false);
  }
}