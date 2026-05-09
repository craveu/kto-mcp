import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { BarrierFreeTourInfoService } from './barrier-free-tour-info.service';

@Module({
  imports: [KtoModule],
  providers: [BarrierFreeTourInfoService],
  exports: [BarrierFreeTourInfoService],
})
export class BarrierFreeTourInfoModule {}
