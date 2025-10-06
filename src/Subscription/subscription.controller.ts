import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Post('upgrade')
  upgrade(@Body() body: { userId: number; plan: string }) {
    return this.subscriptionService.upgradePlan(body.userId, body.plan);
  }

@Post('pay')
async pay(@Body() body: { userId: number; plan: string; paymentProvider: string }) {
  const paymentUrl = await this.subscriptionService.initiatePayment(body.userId, body.plan, body.paymentProvider);
  return { paymentUrl };
}

@Post('webhook')
async webhook(@Body() body: { userId: number; status: string; paymentId: string }) {
  return await this.subscriptionService.handleWebhook(body.userId, body.status, body.paymentId);
}

// Get subscription by user email
@Get('user/email/:email')
async getUserSubscriptionByEmail(@Param('email') email: string) {
  try {
    const subscription = await this.subscriptionService.getSubscriptionByEmail(email, 'user');
    return {
      success: true,
      subscription
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to fetch user subscription'
    };
  }
}

// Get subscription by artisan email
@Get('artisan/email/:email')
async getArtisanSubscriptionByEmail(@Param('email') email: string) {
  try {
    const subscription = await this.subscriptionService.getSubscriptionByEmail(email, 'artisan');
    return {
      success: true,
      subscription
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to fetch artisan subscription'
    };
  }
}

// Update subscription by email
@Put('update')
async updateSubscription(@Body() body: { email: string; userType: 'user' | 'artisan'; newPlan: string }) {
  try {
    const result = await this.subscriptionService.updateSubscriptionByEmail(
      body.email,
      body.userType,
      body.newPlan
    );
    return {
      success: true,
      message: `Subscription updated to ${body.newPlan}`,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to update subscription'
    };
  }
}

}
