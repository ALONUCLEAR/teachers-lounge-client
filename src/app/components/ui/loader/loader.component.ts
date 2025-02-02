import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export enum LoaderChoice {
  Spinner = "Spinner",
  Whiteboard = "Whiteboard"
};

@Component({
  standalone: true,
  selector: 'loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.less'],
  imports: [CommonModule]
})
export class LoaderComponent {
  @Input() choice = LoaderChoice.Whiteboard;

  public readonly LoaderChoice = LoaderChoice;
}
