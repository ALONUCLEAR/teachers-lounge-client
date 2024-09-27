import { Component, DestroyRef, OnInit } from "@angular/core";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { cloneDeep, isEqual, sortBy } from 'lodash';
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
export class SchoolManagementComponent implements OnInit {
    fields: string[] = ['מזהה', "שם", 'ישוב', "רחוב", "מספר בניין", "פעולות", ""];
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
        this.setSchools(mocks);
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

    editSchool(school: School): void {
        if(this.editedSchool && this.editedSchool.id !== school.id) {
            //trying to switch edit in the middle
            alert('no no no');
        } else {
            this.editedMunicipaity.next(school.municipality);
            this.editedSchool = school;
        }
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
    
    saveSchool(school: School): void {        
        const schoolToEdit = this.schools.find(({ id }) => id === school?.id);

        if (!school || !schoolToEdit) {
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
}