import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { GoCampingService } from './go-camping.service';

@Module({
  imports: [KtoModule],
  providers: [GoCampingService],
  exports: [GoCampingService],
})
export class GoCampingModule {}
