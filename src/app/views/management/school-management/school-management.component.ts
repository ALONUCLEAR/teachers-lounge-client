import { Component } from "@angular/core";
import { cloneDeep } from 'lodash';
import { GovernmentData, School } from "src/app/api/types/School";

const mockGov: GovernmentData[] = [
    { id: 'c1', fk: 100, name: 'city one' },
    { id: 's1', fk: 105, name: 'street one'},
    { id: 'c2', fk: 200, name: 'city two' },
    { id: 's2', fk: 204, name: 'street two'},
]

const mocks: School[] = [
  {
    id: '1',
    name: 'test',
    municipality: mockGov[0],
    address: { street: mockGov[1], houseNumber: 69 },
  },
  {
    id: '2',
    name: 'dumb',
    municipality: mockGov[2],
    address: { street: mockGov[3], houseNumber: 420 },
  },
];

@Component({
  selector: 'school-management',
  templateUrl: './school-management.component.html',
  styleUrls: ['./school-management.component.less'],
})
export class SchoolManagementComponent {
    fields: string[] = ['מזהה', "שם", 'ישוב', "רחוב", "מספר בניין", "פעולות"];
    schools: School[] = [];
    editedSchool?: School;

    ngOnInit(): void {
        this.schools = mocks;
        this.editedSchool = undefined;
    }

    editSchool(school: School): void {
        if(this.editedSchool && this.editedSchool.id !== school.id) {
            //trying to switch edit in the middle
            alert('no no no');
        } else {
            this.editedSchool = school;
        }
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

            this.editedSchool = undefined;
        } catch(error) {
            schoolToEdit.name = preEditSchool.name;
            schoolToEdit.address = preEditSchool.address;
            schoolToEdit.municipality = preEditSchool.municipality;

            alert('Invliad values');
        }
    }


    private getGovInfoByName(name: string, url: string): GovernmentData {

        return {
            id: "5",
            name,
            fk: 200
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