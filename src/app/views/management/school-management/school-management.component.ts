import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { cloneDeep, isEqual, sortBy } from 'lodash';
import { BehaviorSubject, filter, switchMap } from 'rxjs';
import { GovernmentData, Street } from 'src/app/api/gov/types';
import { getAllSchools } from 'src/app/api/server/getters/get-schools';
import { School } from 'src/app/api/server/types/school';
import {
  ActionType,
  FieldType,
  PropertyField,
} from 'src/app/components/ui/my-table/my-table.components';
import { NotificationsService } from 'src/app/services/notifications.service';
import { MunicipaitiesQuery } from 'src/app/stores/gov/municipalities/municipalities.query';
import { StreetsQuery } from 'src/app/stores/gov/streets/streets.query';

const emptySchool: School = {
  id: '',
  name: '',
  municipality: {
    fk: -1,
    id: -1,
    name: '',
  },
  address: {
    street: {
      id: -1,
      fk: -1,
      municipalityFk: -1,
      name: '',
    },
    houseNumber: 0,
  },
};

@Component({
  selector: 'school-management',
  templateUrl: './school-management.component.html',
  styleUrls: ['./school-management.component.less'],
  providers: [MunicipaitiesQuery, StreetsQuery],
})
export class SchoolManagementComponent implements OnInit, OnDestroy {
  fields: PropertyField<School>[] = [
    {
      type: FieldType.READONLY,
      title: 'מזהה',
      mapper: (school) => school.id,
    },
    {
      type: FieldType.EDITABLE,
      title: 'שם',
      mapper: (school) => school.name,
    },
    {
      type: FieldType.EDITABLE,
      title: 'ישוב',
      mapper: (school) => school.municipality.name,
    },
    {
      type: FieldType.EDITABLE,
      title: 'רחוב',
      mapper: (school) => school.address.street.name,
    },
    {
      type: FieldType.EDITABLE,
      title: 'מספר בניין',
      mapper: (school) => `${school.address.houseNumber}`,
    },
  ];
  schools: School[] = [];
  inputEditedEntityIndex = -1;
  editedMunicipaity = new BehaviorSubject<GovernmentData | null>(null);

  allMunicipalities: GovernmentData[] = [];
  streetsForEditedMunicipality: Street[] = [];
  readonly midEditSwapAlert =
    'לערוך את בית הספר הזה יאפס את השינויים שלא שמרתם על בית הספר הקודם';
  readonly emptySchool = emptySchool;

  private intervals: number[] = [];

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly municipaitiesQuery: MunicipaitiesQuery,
    private readonly streetsQuery: StreetsQuery,
    private readonly notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {
    this.fetchSchools();
    this.municipaitiesQuery
      .selectAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((entities) => entities.length > 0)
      )
      .subscribe((municipaities) => (this.allMunicipalities = municipaities));

    this.editedMunicipaity
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(Boolean),
        switchMap((municipaity) =>
          this.streetsQuery.selectStreetsByMunicipality(municipaity)
        )
      )
      .subscribe((streets) => this.streetsForEditedMunicipality = streets);
  }

  private setSchools(schools: School[]): void {
    this.schools = sortBy(schools, (school) => school.name);
  }

  // returns true if nothing changed(we can continue saving) and false otherwise
  private async getAndSetSchools(isFirstCheck = false): Promise<boolean> {
    try {
        const idSorter = (school: School) => school.id;
      const upToDateSchools = sortBy(await getAllSchools(), idSorter);
      const nonNewSchools = sortBy(this.schools.filter(({ id }) => id != emptySchool.id), idSorter);

      if (!isEqual(upToDateSchools, nonNewSchools)) {
        this.resetEditedFields();
        this.setSchools(upToDateSchools);

        if (!isFirstCheck) {
          this.notificationsService.info('רשימת בתי הספר התעדכנה', {
            title: 'זןהה עדכון',
          });
        }

        return false;
      }
    } catch (error) {
      console.error(error);
    }

    return true;
  }

  private fetchSchools(): void {
    this.getAndSetSchools(true);
    const interval = window.setInterval(() => this.getAndSetSchools(), 5000);
    this.intervals.push(interval);
  }

  private removeAllIntervals(): void {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  handleEditChange({ entity: school, index }: { entity: School; index: number; }): void {
    this.editedMunicipaity.next(school.municipality);
    this.inputEditedEntityIndex = index;
  }

  handleAction({ action, entity, editedEntity }: { action: ActionType; entity?: School; editedEntity?: School; }): void {
    switch (action) {
      case ActionType.DELETE:
        this.deleteSchool(entity, editedEntity);
        break;
      default:
        this.saveSchool(entity, editedEntity);
        break;
    }
  }

  changeMunicipality(municipality: GovernmentData, editedSchool: School) {
    if (!editedSchool) {
      return;
    }

    if (municipality) {
      this.editedMunicipaity.next(municipality);
    }

    editedSchool.municipality = municipality;
  }

  changeStreet(street: Street, editedSchool: School): void {
    if (!editedSchool) {
      return;
    }

    editedSchool.address.street = street;
  }

  deleteSchool(school?: School, editedSchool?: School): void {
    if (!school) {
      this.notificationsService.error(`לא נבחר בית ספר למחיקה`);

      return;
    }
    // throw confirmation message

    if (school.id === editedSchool?.id) {
      this.resetEditedFields();
    }

    this.setSchools(this.schools.filter(({ id }) => id !== school.id));

    // delete from server
  }

  private isSchoolValid(school: School): boolean {
    const { name, municipality, address: { street, houseNumber } } = school;

    if (name.length < 1 || name.length > 255) {
      return false;
    }

    if (!municipality) {
      return false;
    }

    if (!street) {
      return false;
    }

    if (houseNumber < 0 || houseNumber > 1023) {
      return false;
    }

    return true;
  }

  async saveSchool(school?: School, schoolToEdit?: School): Promise<void> {
    if (!school || !schoolToEdit) {
      return;
    }

    if (!await this.getAndSetSchools()) {
      return;
    }

    const preEditSchool = cloneDeep(schoolToEdit);

    try {
      if (!this.isSchoolValid(school)) {
        this.notificationsService.error('חפשו שדות אדומים ותקנו אותם', {
          title: 'שגיאה בשמרית בית ספר',
        });

        throw new Error('Invalid school fields');
      }

      schoolToEdit.name = school.name;
      schoolToEdit.municipality = school.municipality;
      schoolToEdit.address = school.address;

      const schoolIndex = this.schools.findIndex(({ id }) => id === school.id);

      if (schoolIndex < 0) {
        this.schools.push(school);
      } else {
        this.schools[schoolIndex] = school;
      }
      this.schools = [...this.schools];

      this.resetEditedFields();

      //server.upsert school
    } catch (error) {
      schoolToEdit.name = preEditSchool.name;
      schoolToEdit.address = preEditSchool.address;
      schoolToEdit.municipality = preEditSchool.municipality;
    }
  }

  private resetEditedFields(): void {
    this.inputEditedEntityIndex = -1;
    this.editedMunicipaity.next(null);
  }

  ngOnDestroy(): void {
    this.removeAllIntervals();
  }
}