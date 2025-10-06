import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Etoffre } from './offre.entity';
import { EtoffreService } from './offre.service';
import { EtoffreController } from './offre.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Etoffre])],
  controllers: [EtoffreController],
  providers: [EtoffreService],
})
export class EtoffreModule {}
