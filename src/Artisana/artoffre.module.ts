import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtOffre } from './artoffre.entity';
import { Artisan } from '../auth/entities/artisan.entity';
import { ArtOffreService } from './artoffre.service';
import { ArtOffreController } from './artoffre.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArtOffre, Artisan])],
  providers: [ArtOffreService],
  controllers: [ArtOffreController],
  exports: [ArtOffreService],
})
export class ArtOffreModule {}
