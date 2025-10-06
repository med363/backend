import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../etablissements/order/order.entity';
import { Artisan } from '../../auth/entities/artisan.entity';
import { Etablissement } from '../../auth/entities/etablissement.entity';

@Injectable()
export class CondOrderService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  @InjectRepository(Artisan) private readonly artisanaRepo: Repository<Artisan>,
    @InjectRepository(Etablissement) private readonly etabRepo: Repository<Etablissement>,
  ) {}

  async getOrdersIfEmbauche(artisanaId: number, etablissementId: number) {
    // Check if artisan is employed in the etablissement
    const artisan = await this.artisanaRepo.findOne({ where: { id: artisanaId }, relations: ['etablissements'] });
    if (!artisan) throw new Error('Artisan not found');
  const isEmbauche = (artisan as any).etablissements?.some((e: any) => e.id === etablissementId);
    if (!isEmbauche) return [];
    return this.orderRepo.find({ where: { etablissement: { id: etablissementId } }, relations: ['etablissement'] });
  }
    async checkEmbauche(artisanaId: number, etablissementId: number) {
    // Check if artisan is employed in the etablissement
    const artisan = await this.artisanaRepo.findOne({ where: { id: artisanaId }, relations: ['etablissements'] });
    if (!artisan) return { isEmbauche: false };
    const isEmbauche = (artisan as any).etablissements?.some((e: any) => e.id === +etablissementId);
    return { isEmbauche };
  }
}
