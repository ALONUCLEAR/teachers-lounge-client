import { Component, DestroyRef, OnDestroy, OnInit } from "@angular/core";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { cloneDeep, isEqual, sortBy } from 'lodash';
import { BehaviorSubject, filter, switchMap } from "rxjs";
import { GovernmentData, Street } from "src/app/api/gov/types";
import { getAllSchools } from "src/app/api/server/getters/get-schools";
import { School } from "src/app/api/server/types/school";
import { ConfirmationPopupComponent, ConfirmationResult } from "src/app/components/ui/confirmation-popup/confirmation-popup.component";
import { ToastService } from "src/app/services/toast.service";
import { MunicipaitiesQuery } from "src/app/stores/gov/municipalities/municipalities.query";
import { StreetsQuery } from "src/app/stores/gov/streets/streets.query";

const emptySchool: School = {
    id: '',
    name: '',
    municipality: {
        fk: -1,
        id: -1,
        name: ''
    },
    address: {
        street: {
            id: -1,
            fk: -1,
            municipalityFk: -1,
            name: ''
        },
        houseNumber: 0
    }
};

@Component({
  selector: 'school-management',
  templateUrl: './school-management.component.html',
  styleUrls: ['./school-management.component.less'],
  providers: [MunicipaitiesQuery, StreetsQuery]
})
export class SchoolManagementComponent implements OnInit, OnDestroy {
    fields: string[] = ['מזהה', "שם", 'ישוב', "רחוב", "מספר בניין", "פעולות", ""];
    schools: School[] = [];
    editedSchool?: School;
    editedMunicipaity = new BehaviorSubject<GovernmentData | null>(null);

    allMunicipalities: GovernmentData[] = [];
    streetsForEditedMunicipality: Street[] = [];

    private intervals: number[] = [];

    constructor(
        private readonly destroyRef: DestroyRef,
        private readonly municipaitiesQuery: MunicipaitiesQuery,
        private readonly streetsQuery: StreetsQuery,
        private readonly modalService: NgbModal,
        private readonly toastService: ToastService
    ) {}

    ngOnInit(): void {
        this.fetchSchools();
        this.municipaitiesQuery
            .selectAll()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                filter(entities => entities.length > 0)
            ).subscribe(municipaities => this.allMunicipalities = municipaities);
        
        this.editedMunicipaity.pipe(
            takeUntilDestroyed(this.destroyRef),
            filter(Boolean),
            switchMap(municipaity =>this.streetsQuery.selectStreetsByMunicipality(municipaity))
        ).subscribe(streets => this.streetsForEditedMunicipality = streets);
    }

    private setSchools(schools: School[]): void {
        this.schools = sortBy(schools, (school) => school.name);
    }

    // returns true if nothing changed(we can continue saving) and false otherwise
    private async getAndSetSchools(isFirstCheck = false): Promise<boolean> {
        try {
            const upToDateSchools = await getAllSchools();
            const nonNewSchools = this.schools.filter(({id}) => id != emptySchool.id);

            if (!isEqual(upToDateSchools, nonNewSchools)) {
                this.resetEditedSchool();
                this.setSchools(upToDateSchools);

                if (!isFirstCheck) {
                    this.toastService.show({header: 'זוהה עדכון', message: 'רשימת בתי הספר התעדכנה', classes: ['t-success']});
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

    async editSchool(school: School): Promise<void> {
        if(this.editedSchool && this.editedSchool.id !== school.id) {
            const modalRef = this.modalService.open(ConfirmationPopupComponent);
            const componentInstance: ConfirmationPopupComponent = modalRef.componentInstance;
            componentInstance.body = 'לערוך את בית הספר הזה יאפס את השינויים שלא שמרתם על בית הספר הקודם';

            const result = await modalRef.result;

            if (result !== ConfirmationResult.OK) {
                return;
            }
        }

        const newEditedSchool = cloneDeep(school);
        this.editedMunicipaity.next(newEditedSchool.municipality);
        this.editedSchool = newEditedSchool;
    }

    addSchool(): void {
        if (this.editedSchool) {
            return;
        }

        this.schools.unshift(emptySchool);
        this.editedSchool = emptySchool;
    }

    changeMunicipality(municipality: GovernmentData) {
        if (!this.editedSchool) {
            return;
        }

        if (municipality) {
            this.editedMunicipaity.next(municipality);
        }
        this.editedSchool.municipality = municipality;
    }

    changeStreet(street: Street): void {
        if (!this.editedSchool) {
            return;
        }

        this.editedSchool.address.street = street;
    }

    deleteSchool(school: School): void {
        // throw confirmation message

        if (school.id === this.editedSchool?.id) {
            this.resetEditedSchool();
        }

        this.setSchools(this.schools.filter(({ id }) => id !== school.id));

        // delete from server
    }

    private isSchoolValid(school: School): boolean {
        const { name, municipality, address: { street, houseNumber } } = school;

        if (name.length < 1 && name.length > 255) {
            return false;
        }

        if (!municipality) {
            console.log({municipality});
            return false;
        }

        if (!street) {
            console.log({street});
            return false;
        }

        if (houseNumber < 0 || houseNumber > 1023) {
            return false;
        }

        return true;
    }
    
    async saveSchool(school: School): Promise<void> {        
        const schoolToEdit = this.schools.find(({ id }) => id === school?.id);

        if (!school || !schoolToEdit) {
          return;
        }

        if (!await this.getAndSetSchools()) {
            return;
        }

        const preEditSchool = cloneDeep(schoolToEdit);

        try {
            if (!this.isSchoolValid(school)) {
                throw new Error("Invalid school fields")
            }

            schoolToEdit.name = school.name;
            schoolToEdit.municipality = school.municipality;
            schoolToEdit.address = school.address;

            this.resetEditedSchool();

            //server.upsert school
        } catch(error) {
            schoolToEdit.name = preEditSchool.name;
            schoolToEdit.address = preEditSchool.address;
            schoolToEdit.municipality = preEditSchool.municipality;

            alert('Invliad values');
        }
    }

    private resetEditedSchool(): void {
        this.editedSchool = undefined;
        this.editedMunicipaity.next(null);
    }

    trackById(index: number, school: School): string {
        return `index-${index};school-${school.id}`;
    }

    ngOnDestroy(): void {
        this.removeAllIntervals();
    }
}