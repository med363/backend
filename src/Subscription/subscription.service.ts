import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentService } from 'src/Payment/payment.service';
import { User } from '../auth/entities/user.entity';
import { Artisan } from '../auth/entities/artisan.entity';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly paymentService: PaymentService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Artisan)
    private readonly artisanRepository: Repository<Artisan>,
  ) {}

  getPlans() {
    return [
      { name: 'Basic', price: 9, features: ['Standard features'] },
      { name: 'Premium', price: 49, features: ['Premium features', 'Priority support'] },
    ];
  }

  async upgradePlan(userId: number, plan: string) {
    // TODO: Update user plan in DB
    return { message: `User ${userId} upgraded to ${plan}` };
  }

  async initiatePayment(userId: number, plan: string, paymentProvider: string) {
    if (paymentProvider === 'konnect') {
      // Call Konnect API (pseudo-code)
      const paymentUrl = await this.paymentService.createKonnectPayment(userId, plan);
      return { paymentUrl };
    }
    return { message: `Payment provider ${paymentProvider} not supported` };
  }

  async handleWebhook(userId: number, status: string, paymentId: string) {
    let user = { id: userId, subscriptionStatus: 'PENDING', paymentHistory: [] };

    if (status === 'paid') {
      user = await this.paymentService.confirmPayment(user, this.getPlanPrice(paymentId), paymentId);
      return { message: `Payment ${paymentId} received, subscription activated for user ${userId}`, user };
    } else {
      user = await this.paymentService.failPayment(user, paymentId);
      return { message: `Payment ${paymentId} failed`, user };
    }
  }

  private getPlanPrice(plan: string | number) {
    // Simplified, you can map plan name/ID to price
    if (plan === 'Premium') return 49;
    return 9; // Basic
  }

  // Get subscription by email
  async getSubscriptionByEmail(email: string, userType: 'user' | 'artisan') {
    try {
      if (userType === 'user') {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
          throw new Error('User not found');
        }
        return {
          abonnement: user.subscriptionPlan || 'gratuit',
          subscriptionStatus: user.subscriptionStatus,
          paymentStatus: user.paymentStatus,
          subscriptionStartDate: user.subscriptionStartDate,
          subscriptionEndDate: user.subscriptionEndDate,
        };
      } else {
        const artisan = await this.artisanRepository.findOne({ where: { email } });
        if (!artisan) {
          throw new Error('Artisan not found');
        }
        return {
          abonnement: artisan.subscriptionPlan || 'gratuit',
          subscriptionStatus: artisan.subscriptionStatus,
          paymentStatus: artisan.paymentStatus,
          subscriptionStartDate: artisan.subscriptionStartDate,
          subscriptionEndDate: artisan.subscriptionEndDate,
        };
      }
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error.message}`);
    }
  }

  // Update subscription by email
  async updateSubscriptionByEmail(email: string, userType: 'user' | 'artisan', newPlan: string) {
    try {
      const subscriptionStartDate = new Date();
      const subscriptionEndDate = new Date();
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // Add 1 month

      if (userType === 'user') {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
          throw new Error('User not found');
        }

        await this.userRepository.update(
          { email },
          {
            subscriptionPlan: newPlan,
            subscriptionStatus: 'ACTIVE',
            subscriptionStartDate,
            subscriptionEndDate,
          }
        );

        return await this.userRepository.findOne({ where: { email } });
      } else {
        const artisan = await this.artisanRepository.findOne({ where: { email } });
        if (!artisan) {
          throw new Error('Artisan not found');
        }

        await this.artisanRepository.update(
          { email },
          {
            subscriptionPlan: newPlan,
            subscriptionStatus: 'ACTIVE',
            subscriptionStartDate,
            subscriptionEndDate,
          }
        );

        return await this.artisanRepository.findOne({ where: { email } });
      }
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }
}
