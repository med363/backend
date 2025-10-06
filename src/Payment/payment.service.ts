import { Injectable } from '@nestjs/common';
import { KonnectService } from './konnect.service';

@Injectable()
export class PaymentService {
  constructor(private readonly konnectService: KonnectService) {}

  async createKonnectPayment(userId: number, plan: string) {
    const amount = plan === 'Premium' ? 49 : 9; // Map plan to price
    return await this.konnectService.createPayment(userId, plan, amount);
  }

  async confirmPayment(user, amount, paymentId) {
    user.subscriptionStatus = 'ACTIVE';
    user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    user.paymentHistory = [...(user.paymentHistory || []), { paymentId, amount, date: new Date() }];
    return user;
  }

  async failPayment(user, paymentId) {
    user.subscriptionStatus = 'PENDING';
    return user;
  }

  async initPayment(userId: number, amount: number, provider: string) {
    // TODO: Integrate with Konnect/Flouci API
    return { message: `Payment initiated for user ${userId} amount ${amount} via ${provider}` };
  }
}
