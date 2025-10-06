import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { KonnectService } from './konnect.service';

@Module({
  imports: [HttpModule],
  providers: [PaymentService, KonnectService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
