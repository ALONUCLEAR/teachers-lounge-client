import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'includes',
  standalone: true,
})
export class IncludesPipe implements PipeTransform {
  transform<TValue>(array: TValue[], value: TValue): boolean {
    return array.includes(value);
  }
}