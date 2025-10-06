import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Artisan } from './entities/artisan.entity';
import { Etablissement } from './entities/etablissement.entity';

export interface SubscriptionStatus {
  isActive: boolean;
  isExpired: boolean;
  isApproachingExpiry: boolean; // Within 3 days of expiry
  daysUntilExpiry?: number;
  paymentStatus: 'payed' | 'non_payed';
  subscriptionPlan: string;
  canAccessDashboard: boolean;
}

@Injectable()
export class SubscriptionCheckerService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Artisan)
    private artisanRepository: Repository<Artisan>,
    @InjectRepository(Etablissement)
    private etablissementRepository: Repository<Etablissement>,
  ) {}

  /**
   * Check subscription status for any entity type
   */
  private checkSubscriptionStatus(entity: User | Artisan | Etablissement): SubscriptionStatus {
    const now = new Date();
    const subscriptionEndDate = entity.subscriptionEndDate;
    const paymentStatus = entity.paymentStatus as 'payed' | 'non_payed';
    const subscriptionStatus = entity.subscriptionStatus;
    
    let isExpired = false;
    let isApproachingExpiry = false;
    let daysUntilExpiry: number | undefined;

    if (subscriptionEndDate) {
      const timeDiff = subscriptionEndDate.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      isExpired = daysUntilExpiry <= 0;
      isApproachingExpiry = daysUntilExpiry > 0 && daysUntilExpiry <= 3;
    }

    const isActive = subscriptionStatus === 'ACTIVE' && !isExpired;
    const canAccessDashboard = isActive && paymentStatus === 'payed';

    return {
      isActive,
      isExpired,
      isApproachingExpiry,
      daysUntilExpiry: daysUntilExpiry || undefined,
      paymentStatus,
      subscriptionPlan: entity.subscriptionPlan,
      canAccessDashboard
    };
  }

  /**
   * Check user subscription status by email
   */
  async checkUserSubscription(email: string): Promise<SubscriptionStatus | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) return null;
    
    return this.checkSubscriptionStatus(user);
  }

  /**
   * Check artisan subscription status by email
   */
  async checkArtisanSubscription(email: string): Promise<SubscriptionStatus | null> {
    const artisan = await this.artisanRepository.findOne({ where: { email } });
    if (!artisan) return null;
    
    return this.checkSubscriptionStatus(artisan);
  }

  /**
   * Check etablissement subscription status by email
   */
  async checkEtablissementSubscription(email: string): Promise<SubscriptionStatus | null> {
    const etablissement = await this.etablissementRepository.findOne({ where: { email } });
    if (!etablissement) return null;
    
    return this.checkSubscriptionStatus(etablissement);
  }

  /**
   * Update subscription end date when payment is made
   */
  async extendSubscription(entityType: 'user' | 'artisan' | 'etablissement', email: string): Promise<void> {
    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

    switch (entityType) {
      case 'user':
        await this.userRepository.update(
          { email },
          {
            subscriptionEndDate: oneMonthLater,
            subscriptionStartDate: now,
            subscriptionStatus: 'ACTIVE',
            paymentStatus: 'payed'
          }
        );
        break;
      case 'artisan':
        await this.artisanRepository.update(
          { email },
          {
            subscriptionEndDate: oneMonthLater,
            subscriptionStartDate: now,
            subscriptionStatus: 'ACTIVE',
            paymentStatus: 'payed'
          }
        );
        break;
      case 'etablissement':
        await this.etablissementRepository.update(
          { email },
          {
            subscriptionEndDate: oneMonthLater,
            subscriptionStartDate: now,
            subscriptionStatus: 'ACTIVE',
            paymentStatus: 'payed'
          }
        );
        break;
    }
  }

  /**
   * Mark subscription as expired for entities that have passed their end date
   */
  async updateExpiredSubscriptions(): Promise<void> {
    const now = new Date();

    // Update expired users
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ subscriptionStatus: 'EXPIRED' })
      .where('subscriptionEndDate < :now', { now })
      .andWhere('subscriptionStatus = :status', { status: 'ACTIVE' })
      .execute();

    // Update expired artisans
    await this.artisanRepository
      .createQueryBuilder()
      .update(Artisan)
      .set({ subscriptionStatus: 'EXPIRED' })
      .where('subscriptionEndDate < :now', { now })
      .andWhere('subscriptionStatus = :status', { status: 'ACTIVE' })
      .execute();

    // Update expired etablissements
    await this.etablissementRepository
      .createQueryBuilder()
      .update(Etablissement)
      .set({ subscriptionStatus: 'EXPIRED' })
      .where('subscriptionEndDate < :now', { now })
      .andWhere('subscriptionStatus = :status', { status: 'ACTIVE' })
      .execute();
  }
}