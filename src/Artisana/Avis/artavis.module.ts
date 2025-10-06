import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArtAvis } from './artavis.entity';
import { Artisan } from '../../auth/entities/artisan.entity';
import { User } from '../../auth/entities/user.entity';
import { ArtAvisService } from './artavis.service';
import { ArtAvisController } from './artavis.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArtAvis, Artisan, User])],
  providers: [ArtAvisService],
  controllers: [ArtAvisController],
  exports: [ArtAvisService],
})
export class ArtAvisModule {}
