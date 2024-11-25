import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { cloneDeep, isEqual, omit, sortBy } from 'lodash';
import { BehaviorSubject, filter, switchMap } from 'rxjs';
import { GovernmentData, Street } from 'src/app/api/gov/types';
import { getAllSchools, tryDeleteSchool, tryUpsertSchool } from 'src/app/api/server/actions/school-actions';
import { School } from 'src/app/api/server/types/school';
import { ConfirmationPopupComponent, ConfirmationResult } from 'src/app/components/ui/confirmation-popup/confirmation-popup.component';
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
      mapper: (school) => {
        const { id } = school;
        const len = id?.length ?? 0;

        return len < 8 ? id : `${school.id.substring(len - 5, len)}...`;
      },
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
  private schools: School[] = [];
  filteredSchools: School[] = [];
  inputEditedEntityIndex = -1;
  editedMunicipaity = new BehaviorSubject<GovernmentData | null>(null);

  allMunicipalities: GovernmentData[] = [];
  streetsForEditedMunicipality: Street[] = [];
  readonly midEditSwapAlert =
    'לערוך את בית הספר הזה יאפס את השינויים שלא שמרתם על בית הספר הקודם';
  readonly emptySchool = emptySchool;

  private intervals: number[] = [];
  nameFilter = '';
  private municipalityFilter?: GovernmentData = undefined;
  private streetFilter?: Street = undefined;
  filterMunicipalities$ = new BehaviorSubject<GovernmentData[]>([]);
  filterStreets: Street[] = [];

  constructor(
    private readonly destroyRef: DestroyRef,
    private readonly municipaitiesQuery: MunicipaitiesQuery,
    private readonly streetsQuery: StreetsQuery,
    private readonly notificationsService: NotificationsService,
    private readonly modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.fetchSchools();
    this.municipaitiesQuery
      .selectAll()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((entities) => entities.length > 0)
      )
      .subscribe((municipaities) => {
        this.allMunicipalities = municipaities;
        this.filterMunicipalities$.next([...municipaities]);
      });

    this.editedMunicipaity
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(Boolean),
        switchMap((municipaity) =>
          this.streetsQuery.selectStreetsByMunicipality(municipaity)
        )
      )
      .subscribe((streets) => (this.streetsForEditedMunicipality = streets));
  }

  private setSchools(schools: School[]): void {
    this.schools = sortBy(schools, (school) => school.name);
    this.filterSchools();
  }

  // returns true if nothing changed(we can continue saving) and false otherwise
  private async getAndSetSchools(alertUserToChange = true): Promise<boolean> {
    try {
      const idSorter = (school: School) => school.id;
      const upToDateSchools = sortBy(await getAllSchools(), idSorter);
      const nonNewSchools = sortBy(this.schools.filter(({ id }) => id !== emptySchool.id), idSorter);

      if (!isEqual(upToDateSchools, nonNewSchools)) {
        this.resetEditedFields();
        this.setSchools(upToDateSchools);

        if (alertUserToChange) {
          this.notificationsService.info('רשימת בתי הספר התעדכנה', {
            title: 'זוהה עדכון',
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
    this.getAndSetSchools(false);
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

  async handleAction({ action, entity, editedEntity }: { action: ActionType; entity?: School; editedEntity?: School; }): Promise<void> {
    switch (action) {
      case ActionType.DELETE:
        await this.deleteSchool(entity, editedEntity);
        break;
      default:
        await this.saveSchool(entity, editedEntity);
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

  private async confirmDelete(school: School): Promise<boolean> {
    const schoolName = school.name ? `"${school.name}"` : 'בית הספר הזה';

    const modalRef = this.modalService.open(ConfirmationPopupComponent);
    const componentInstance: ConfirmationPopupComponent = modalRef.componentInstance;

    componentInstance.title = `שימו לב - פעולה בלתי הפיכה`;
    componentInstance.body = `אתם בטוחים שברצונכם למחוק את ${schoolName}?`;
    let result = ConfirmationResult.CANCEL;

    try {
      result = await modalRef.result;
    } catch {
      // user clicked outside the modal to close
    }

    return result === ConfirmationResult.OK;
  }

  async deleteSchool(school?: School, editedSchool?: School): Promise<void> {
    if (!school) {
      this.notificationsService.error(`לא נבחר בית ספר למחיקה`);

      return;
    }

    if (!await this.confirmDelete(school)) {
      return;
    }

    if (school.id === editedSchool?.id) {
      this.resetEditedFields();
    }

    if (school.id !== emptySchool.id) {
      if (!(await tryDeleteSchool(school.id))) {
        this.notificationsService.error('אופס... משהו השתבש', {
          title: 'שגיאה במחיקת בית ספר',
        });
      } else {
        this.notificationsService.info(`בית הספר נמחק בהצלחה`);
        await this.getAndSetSchools(false);
      }
    }

    this.setSchools(this.schools.filter(({ id }) => id !== school.id));
  }

  private isSchoolValid(school: School): boolean {
    const {
      name,
      municipality,
      address: { street, houseNumber },
    } = school;

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

    if (!(await this.getAndSetSchools())) {
      return;
    }

    const preEditSchool = cloneDeep(schoolToEdit);

    try {
      if (!this.isSchoolValid(school)) {
        this.notificationsService.error('חפשו שדות אדומים ותקנו אותם', {
          title: 'שגיאה בשמירת בית ספר',
        });

        throw new Error('Invalid school fields');
      }

      schoolToEdit.name = school.name;
      schoolToEdit.municipality = school.municipality;
      schoolToEdit.address = school.address;

      const schoolIndex = this.schools.findIndex(({ id }) => id === school.id);

      const needToUpsert = schoolIndex < 0
        || !isEqual(this.schools[schoolIndex], omit(school, 'displayId'));

      if (!needToUpsert) {
        this.resetEditedFields();

        return;
      }

      if (schoolIndex < 0) {
        this.schools.push(school);
      } else {
        this.schools[schoolIndex] = school;
      }
      this.filterSchools();

      if (!(await tryUpsertSchool(schoolToEdit))) {
        this.notificationsService.error('אופס... משהו השתבש', {
          title: 'שגיאה בשמירת בית ספר',
        });
      } else {
        const actionName = schoolIndex < 0 ? `נוצר` : `עודכן`;
        this.notificationsService.info(`בית הספר ${actionName} בהצלחה`);
        await this.getAndSetSchools(false);
      }

      this.resetEditedFields();
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

  filterSchools(): void {
    const passNameFilter = (school: School) =>
      !this.nameFilter.trim() || school.name.includes(this.nameFilter.trim());
    const passMunicipalityFilter = (school: School) =>
      !this.municipalityFilter ||
      school.municipality.id === this.municipalityFilter.id;
    const passStreetFilter = (school: School) =>
      !this.streetFilter || school.address.street.id === this.streetFilter.id;

    this.filteredSchools = this.schools.filter(
      (school) =>
        passNameFilter(school) &&
        passMunicipalityFilter(school) &&
        passStreetFilter(school)
    );
  }

  changeNameFilter(name: string): void {
    this.nameFilter = name ?? "";
    this.filterSchools();
  }

  changeMunicipalityFilters(municipality?: GovernmentData): void {
    const changedMunicipality = this.municipalityFilter?.id !== municipality?.id;

    this.municipalityFilter = municipality ? { ...municipality } : undefined;
    this.filterStreets = municipality?.fk
      ? this.streetsQuery.getStreetsByMunicipality(municipality)
      : [];

    if (changedMunicipality) {
      this.streetFilter = undefined;
    }

    this.filterSchools();
  }

  changeStreetFilters(street?: Street): void {
    this.streetFilter = street ? { ...street } : undefined;
    this.filterSchools();
  }

  clearFilters(): void {
    this.nameFilter = "";
    // empty and refill to clear municipalities
    this.filterMunicipalities$.next([]);
    console.log(new Date(), `emptied`);
    this.changeMunicipalityFilters(undefined);
    setTimeout(() => {
      this.filterMunicipalities$.next([...this.allMunicipalities]);
      console.log(new Date(), `refilled`);
    }, 0);
  }

  ngOnDestroy(): void {
    this.removeAllIntervals();
  }
}