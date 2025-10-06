import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAvis } from './useravis.entity';
import { User } from '../../auth/entities/user.entity';
import { UserAvisDto } from './dto/useravis.dto';

@Injectable()
export class UserAvisService {
  constructor(
    @InjectRepository(UserAvis) private readonly userAvisRepo: Repository<UserAvis>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async createAvis(dto: UserAvisDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new Error('User not found');
    const avis = this.userAvisRepo.create({
      rate: dto.rate,
      comment: dto.comment,
      artisanId: dto.artisanId,
      user,
    });
    return this.userAvisRepo.save(avis);
  }

  async getAvisByUser(userId: number) {
    return this.userAvisRepo.find({ 
      where: { user: { id: userId } },
      relations: ['user']
    });
  }

  async createAvisForArtisan(userId: number, artisanId: number, rate: number, comment: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    const avis = this.userAvisRepo.create({
      rate,
      comment,
      artisanId,
      user,
    });
    return this.userAvisRepo.save(avis);
  }

  async getAvisForArtisan(userId: number, artisanId: number) {
    return this.userAvisRepo.find({ 
      where: { 
        user: { id: userId },
        artisanId: artisanId
      },
      relations: ['user']
    });
  }

  async getAllReviewsForArtisan(artisanId: number) {
    return this.userAvisRepo.find({ 
      where: { 
        artisanId: artisanId
      },
      relations: ['user'],
      order: { createdAt: 'DESC' } // Most recent first
    });
  }

  async getAllReviews() {
    return this.userAvisRepo.find({ 
      relations: ['user'],
      order: { createdAt: 'DESC' } // Most recent first
    });
  }
}
