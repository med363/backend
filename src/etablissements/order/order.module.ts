import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { UserSharedOrder } from './user-shared-order.entity';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CondOrderController } from './cond-order.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, UserSharedOrder]), forwardRef(() => AuthModule)],
  providers: [OrderService],
  controllers: [OrderController, CondOrderController],
  exports: [OrderService],
})
export class OrderModule {}
