import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'func',
  standalone: true,
})
export class FuncPipe implements PipeTransform {
  transform<TValue, TRes>(value: TValue, func: (input: TValue) => TRes): TRes
  transform<TValue, TRes>(value: TValue, func: (input: TValue, ...moreParams: any) => TRes, moreParams: any): TRes
  transform<TValue, TRes>(value: TValue, func: (input: TValue, ...moreParams: any) => TRes, moreParams?: any): TRes {
    return moreParams ? func(value, moreParams) : func(value);
  }
}