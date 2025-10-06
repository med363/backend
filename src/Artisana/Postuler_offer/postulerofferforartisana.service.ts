import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostulerOfferForArtisana } from './postulerofferforartisana.entity';
import { Artisan } from '../../auth/entities/artisan.entity';
import { PostulerOfferForArtisanaDto } from './dto/postulerofferforartisana.dto';

@Injectable()
export class PostulerOfferForArtisanaService {
  constructor(
    @InjectRepository(PostulerOfferForArtisana) private readonly postulerRepo: Repository<PostulerOfferForArtisana>,
    @InjectRepository(Artisan) private readonly artisanRepo: Repository<Artisan>,
  ) {}

  async create(dto: PostulerOfferForArtisanaDto) {
    const artisan = await this.artisanRepo.findOne({ where: { id: dto.artisanId } });
    if (!artisan) throw new Error('Artisan not found');
    const postuler = this.postulerRepo.create({
      imageProofOfWork: dto.imageProofOfWork,
      title: dto.title ?? '',
      description: dto.description ?? '',
      prix: dto.prix ?? 0,
      artisan,
    });
    return this.postulerRepo.save(postuler);
  }

  async getByArtisan(artisanId: number) {
    return this.postulerRepo.find({ where: { artisan: { id: artisanId } }, relations: ['artisan'] });
  }
}
