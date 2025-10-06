import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArtAvis } from './artavis.entity';
import { Artisan } from '../../auth/entities/artisan.entity';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class ArtAvisService {
  constructor(
    @InjectRepository(ArtAvis) private readonly artavisRepo: Repository<ArtAvis>,
    @InjectRepository(Artisan) private readonly artisanRepo: Repository<Artisan>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async createAvisForUser(
    userId: number,
    artisanId: number,
    rate: number,
    comment: string,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const artisan = await this.artisanRepo.findOne({ where: { id: artisanId } });
    if (!artisan) {
      throw new NotFoundException(`Artisan with id ${artisanId} not found`);
    }

    const avis = this.artavisRepo.create({
      rate,
      comment,
      user,
      artisan,
      userId,
    });

    return this.artavisRepo.save(avis);
  }

  async getAvisForUser(userId: number) {
    const reviews = await this.artavisRepo.find({ where: { userId } });
    const totalReviews = reviews.length;
    const averageRate = totalReviews
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rate, 0) /
            totalReviews
          ).toFixed(2),
        )
      : 0;

    return {
      userId,
      totalReviews,
      averageRate,
    };
  }

  async getAllReviewsForUser(userId: number) {
    return this.artavisRepo.find({
      where: { userId },
      relations: ['artisan'],
      order: { createdAt: 'DESC' },
    });
  }
}
