import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { WellnessTourismService } from './wellness-tourism.service';

@Module({
  imports: [KtoModule],
  providers: [WellnessTourismService],
  exports: [WellnessTourismService],
})
export class WellnessTourismModule {}
