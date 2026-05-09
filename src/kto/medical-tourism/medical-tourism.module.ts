import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { MedicalTourismService } from './medical-tourism.service';

@Module({
  imports: [KtoModule],
  providers: [MedicalTourismService],
  exports: [MedicalTourismService],
})
export class MedicalTourismModule {}
