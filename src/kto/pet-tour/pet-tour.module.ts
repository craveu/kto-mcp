import { Module } from '@nestjs/common';
import { KtoModule } from '../kto.module';
import { PetTourService } from './pet-tour.service';

@Module({
  imports: [KtoModule],
  providers: [PetTourService],
  exports: [PetTourService],
})
export class PetTourModule {}
