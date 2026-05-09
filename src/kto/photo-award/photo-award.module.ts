import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { PhotoAwardService } from './photo-award.service';

@Module({
  imports: [KtoModule],
  providers: [PhotoAwardService],
  exports: [PhotoAwardService],
})
export class PhotoAwardModule {}
