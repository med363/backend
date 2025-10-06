import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PaymentModule } from '../Payment/payment.module';
import { User } from '../auth/entities/user.entity';
import { Artisan } from '../auth/entities/artisan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Artisan]),
    PaymentModule
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
