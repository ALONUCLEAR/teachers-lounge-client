import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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

  @ViewChild('imagePreview', { static: true }) imagePreviewTemplate: any;

  readonly MediaType = MediaType;

  file?: File;
  imageUrl = '';

  constructor(private readonly modalService: NgbModal) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mediaItem']) {
      this.file = this.mediaItem ? ConvertMediaItemToFile(this.mediaItem) : undefined;
 
      if (this.mediaItem?.type === MediaType.JPG) {
        this.imageUrl = this.file ? URL.createObjectURL(this.file) : '';
      }
    }
  }

  openImagePreview(): void {
    this.modalService.open(this.imagePreviewTemplate, {
      size: 'lg',
      centered: true,
      backdrop: true,
      keyboard: true
    });
  }
}
