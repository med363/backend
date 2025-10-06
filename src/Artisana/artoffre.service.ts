import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArtOffre } from './artoffre.entity';
import { Artisan } from '../auth/entities/artisan.entity';
import { ArtOffreDto } from './dto/artoffre.dto';

@Injectable()
export class ArtOffreService {
  constructor(
    @InjectRepository(ArtOffre) private readonly artoffreRepo: Repository<ArtOffre>,
    @InjectRepository(Artisan) private readonly artisanRepo: Repository<Artisan>,
  ) {}

  async createOffre(dto: ArtOffreDto) {
  const artisan = await this.artisanRepo.findOne({ where: { id: dto.artisanId } });
  console.log('createOffre artisanId:', dto.artisanId, 'artisan found:', artisan);
  if (!artisan) throw new Error('Artisan not found');
    const offre = this.artoffreRepo.create({
      title: dto.title,
      description: dto.description,
      prix: dto.prix,
      imageProofOfWork: dto.imageProofOfWork,
      images: dto.images ? JSON.stringify(dto.images) : undefined,
      artisan,
    });
    return this.artoffreRepo.save(offre);
  }

  async getOffresByArtisan(artisanId: number) {
    console.log('Service: getOffresByArtisan called with artisanId:', artisanId);
    
    // First, let's check if the artisan exists
    const artisan = await this.artisanRepo.findOne({ where: { id: artisanId } });
    console.log('Found artisan:', artisan ? `${artisan.firstName} ${artisan.lastName}` : 'NOT FOUND');
    
    // Now let's find offers for this artisan
    const offers = await this.artoffreRepo.find({ 
      where: { artisan: { id: artisanId } },
      relations: ['artisan'] // Include artisan relation for debugging
    });
    
    console.log('Query result - found offers:', offers.length);
    
    // Let's also check all offers in the database for debugging
    const allOffers = await this.artoffreRepo.find({ relations: ['artisan'] });
    console.log('Total offers in database:', allOffers.length);
    
    if (allOffers.length > 0) {
      console.log('Sample offer artisan IDs:', allOffers.map(o => o.artisan?.id));
    }
    
    return offers;
  }

  async getAllOffers() {
    return this.artoffreRepo.find({ relations: ['artisan'] });
  }
}
