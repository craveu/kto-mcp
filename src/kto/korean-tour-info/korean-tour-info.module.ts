import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { KoreanTourInfoService } from './korean-tour-info.service';

@Module({
  imports: [KtoModule],
  providers: [KoreanTourInfoService],
  exports: [KoreanTourInfoService],
})
export class KoreanTourInfoModule {}
