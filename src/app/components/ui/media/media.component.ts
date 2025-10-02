import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MediaItem, MediaType } from 'src/app/api/server/types/post';
import { ConvertMediaItemToFile } from 'src/app/utils/media-utils';


@Component({
  standalone: true,
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.less'],
  imports: [CommonModule]
})
export class MediaComponent implements OnChanges {
  @Input({required: true}) mediaItem?: MediaItem;

  readonly MediaType = MediaType;

  file?: File;
  imageUrl = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mediaItem']) {
      console.log({mediaItem: this.mediaItem})
      this.file = this.mediaItem ? ConvertMediaItemToFile(this.mediaItem) : undefined;
 
      if (this.mediaItem?.type === MediaType.JPG) {
        this.imageUrl = this.file ? URL.createObjectURL(this.file) : '';
      }
    }
  }
}
