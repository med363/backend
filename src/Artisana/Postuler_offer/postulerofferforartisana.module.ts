import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostulerOfferForArtisana } from './postulerofferforartisana.entity';
import { Artisan } from '../../auth/entities/artisan.entity';
import { PostulerOfferForArtisanaService } from './postulerofferforartisana.service';
import { PostulerOfferForArtisanaController } from './postulerofferforartisana.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PostulerOfferForArtisana, Artisan])],
  providers: [PostulerOfferForArtisanaService],
  controllers: [PostulerOfferForArtisanaController],
})
export class PostulerOfferForArtisanaModule {}
