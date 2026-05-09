import { Module } from '@nestjs/common';
import { McpModule } from './mcp/mcp.module';
import { KtoModule } from './kto/kto.module';
import { KoreanTourInfoModule } from './kto/korean-tour-info/korean-tour-info.module';
import { BarrierFreeTourInfoModule } from './kto/barrier-free-tour-info/barrier-free-tour-info.module';
import { PhotoGalleryModule } from './kto/photo-gallery/photo-gallery.module';
import { GoCampingModule } from './kto/go-camping/go-camping.module';
import { AudioGuideModule } from './kto/audio-guide/audio-guide.module';
import { DurunubiModule } from './kto/durunubi/durunubi.module';
import { PetTourModule } from './kto/pet-tour/pet-tour.module';
import { MedicalTourismModule } from './kto/medical-tourism/medical-tourism.module';

@Module({
  imports: [
    McpModule,
    KtoModule,
    KoreanTourInfoModule,
    BarrierFreeTourInfoModule,
    PhotoGalleryModule,
    GoCampingModule,
    AudioGuideModule,
    DurunubiModule,
    PetTourModule,
    MedicalTourismModule,
  ],
})
export class AppModule {}
