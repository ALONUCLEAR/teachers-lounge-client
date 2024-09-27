import { Component, DestroyRef, OnInit } from "@angular/core";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, filter, switchMap } from "rxjs";
import { GovernmentData, Street } from "src/app/api/gov/types";
import { School } from "src/app/api/server/types/school";
import { MunicipaitiesQuery } from "src/app/stores/gov/municipalities/municipalities.query";
import { StreetsQuery } from "src/app/stores/gov/streets/streets.query";

const mockGov: GovernmentData[] = [
    { id: 1, fk: 6200, name: 'בת ים' },
    { id: 1, fk: 105, name: 'הרצל'},
    { id: 2, fk: 200, name: 'חולון' },
    { id: 2, fk: 204, name: 'אילת'},
]

const mocks: School[] = [
  {
    id: '1',
    name: 'ראשון',
    municipality: mockGov[0],
    address: { street: {...mockGov[1], municipalityFk: mockGov[0].fk }, houseNumber: 69 },
  },
  {
    id: '2',
    name: 'שני',
    municipality: mockGov[2],
    address: { street: {...mockGov[3], municipalityFk: mockGov[2].fk }, houseNumber: 420 },
  },
];

@Component({
  selector: 'school-management',
  templateUrl: './school-management.component.html',
  styleUrls: ['./school-management.component.less'],
  providers: [MunicipaitiesQuery, StreetsQuery]
})
export class SchoolManagementComponent implements OnInit {
    fields: string[] = ['מזהה', "שם", 'ישוב', "רחוב", "מספר בניין", "פעולות"];
    schools: School[] = [];
    editedSchool?: School;
    editedMunicipaity = new BehaviorSubject<GovernmentData | null>(null);

    allMunicipalities: GovernmentData[] = [];
    streetsForEditedMunicipality: Street[] = [];

    constructor(
        private readonly destroyRef: DestroyRef,
        private readonly municipaitiesQuery: MunicipaitiesQuery,
        private readonly streetsQuery: StreetsQuery
    ) {}

    ngOnInit(): void {
        this.schools = mocks;
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

    editSchool(school: School): void {
        if(this.editedSchool && this.editedSchool.id !== school.id) {
            //trying to switch edit in the middle
            alert('no no no');
        } else {
            this.editedMunicipaity.next(school.municipality);
            this.editedSchool = school;
        }
    }

    changeMunicipality(municipality: GovernmentData) {
        if (!this.editedSchool) {
            return;
        }

        this.editedMunicipaity.next(municipality);
        this.editedSchool.municipality = municipality;
    }

    changeStreet(street: Street): void {
        if (!this.editedSchool) {
            return;
        }

        this.editedSchool.address.street = street;
    }
    
    saveSchool(school: School): void {        
        const schoolToEdit = this.schools.find(({ id }) => id === school?.id);

        if (!school || !schoolToEdit) {
            return;
        }

        const preEditSchool = cloneDeep(schoolToEdit);

        try {
            schoolToEdit.name = this.getValueIfValid(school.name, (name) => name.length > 0 && name.length < 256);
            schoolToEdit.municipality = this.getGovInfoByName(school.municipality.name, "municiplaity");
            schoolToEdit.address = {
                houseNumber: this.getValueIfValid(school.address.houseNumber, num => num >= 0 && num < 1024),
                street: this.getGovInfoByName(school.address.street.name, "street")
            };

            this.editedMunicipaity.next(null);
            this.editedSchool = undefined;
        } catch(error) {
            schoolToEdit.name = preEditSchool.name;
            schoolToEdit.address = preEditSchool.address;
            schoolToEdit.municipality = preEditSchool.municipality;

            alert('Invliad values');
        }
    }


    private getGovInfoByName(name: string, url: string): Street {

        return {
            id: 5,
            name,
            fk: 200,
            municipalityFk: 4
        };
    }

    private getValueIfValid<T>(value: T, isValid: (val: T) => boolean, errorMessage = "did not pass validator function"): T {
        if (!isValid(value)) {
            throw new Error("Invalid value: " + errorMessage);
        }

        return value;
    }

    trackById(index: number, school: School): string {
        return `index-${index};school-${school.id}`;
    }
}