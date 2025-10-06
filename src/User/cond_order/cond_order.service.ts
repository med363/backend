import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Etablissement } from '../../auth/entities/etablissement.entity';
import { Order } from '../../etablissements/order/order.entity';

@Injectable()
export class CondOrderService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Etablissement) private readonly etabRepo: Repository<Etablissement>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
  ) {}

  // Get orders of an etablissement if user is employed there
  async getOrdersIfUserEmployed(etablissementId: number, userId: number) {
    // Check ManyToMany embauche relation
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['embauchedEtablissements'] });
    if (!user || !user.embauchedEtablissements?.some(e => e.id === +etablissementId)) {
      return { message: 'User is not employed in this etablissement.' };
    }
    // Get orders for the etablissement
    const orders = await this.orderRepo.find({ where: { etablissement: { id: etablissementId } } });
    return orders;
  }
  async checkEmbauche(userId: number, etablissementId: number) {
    // Check ManyToMany embauche relation
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['embauchedEtablissements'] });
    if (!user || !user.embauchedEtablissements?.some(e => e.id === +etablissementId)) {
      return { isEmbauche: false };
    }
    return { isEmbauche: true };
  }
}
