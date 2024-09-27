import { QueryEntity } from "@datorama/akita";
import { MunicipaitiesState, MunicipaitiesStore } from "./municipalities.store";
import { Injectable } from "@angular/core";

@Injectable()
export class MunicipaitiesQuery extends QueryEntity<MunicipaitiesState> {
    constructor(store: MunicipaitiesStore) {
      super(store);
    }
  }