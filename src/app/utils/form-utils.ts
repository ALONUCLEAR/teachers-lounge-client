import { FormArray, FormControl } from "@angular/forms";

/** Angular form arrays are stupid so you can't just setValue */
export function setFormArray<T>(formArray: FormArray<FormControl<T>>, newValues: T[]): void {
    formArray.clear();

    newValues.forEach(value => formArray.push(new FormControl<T>(value, { nonNullable: true })));
}