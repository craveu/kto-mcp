import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { DurunubiService } from './durunubi.service';

@Module({
  imports: [KtoModule],
  providers: [DurunubiService],
  exports: [DurunubiService],
})
export class DurunubiModule {}
