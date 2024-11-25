import { Injectable } from "@angular/core";
import { EntityState, EntityStore, StoreConfig } from "@datorama/akita";
import { getAllMunicipalities } from "src/app/api/gov/get-entities";
import { GovernmentData } from "src/app/api/gov/types";

export interface MunicipaitiesState extends EntityState<GovernmentData, number> { }

@Injectable()
@StoreConfig({ name: 'municipalities' })
export class MunicipaitiesStore extends EntityStore<MunicipaitiesState> {
  constructor() {
    super();
  }

  async initiaize(): Promise<void> {
    this.setLoading(true);
    const municipalities = await getAllMunicipalities();
    this.set(municipalities);
    this.setLoading(false);
  }
}