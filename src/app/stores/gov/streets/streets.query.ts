import { QueryEntity } from '@datorama/akita';
import { StreetsState, StreetsStore } from './streets.store';
import { Injectable } from '@angular/core';
import { GovernmentData, Street } from 'src/app/api/gov/types';
import { Observable } from 'rxjs';

@Injectable()
export class StreetsQuery extends QueryEntity<StreetsState> {
  constructor(protected override store: StreetsStore) {
    super(store);
  }

  selectStreetsByMunicipality(municipality: GovernmentData): Observable<Street[]> {
    return this.selectAll({
      filterBy: (street) => street.municipalityFk === municipality.fk,
    });
  }

  getStreetsByMunicipality(municipality: GovernmentData): Street[] {
    return this.getAll({
      filterBy: (street) => street.municipalityFk === municipality.fk,
    });
  }
}
