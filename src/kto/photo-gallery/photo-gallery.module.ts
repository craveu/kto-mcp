import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { PhotoGalleryService } from './photo-gallery.service';

@Module({
  imports: [KtoModule],
  providers: [PhotoGalleryService],
  exports: [PhotoGalleryService],
})
export class PhotoGalleryModule {}
