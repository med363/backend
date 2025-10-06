import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../auth/entities/user.entity';
import { Etablissement } from '../../auth/entities/etablissement.entity';
import { Order } from '../../etablissements/order/order.entity';
import { CondOrderService } from './cond_order.service';
import { CondOrderController } from './cond_order.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Etablissement, Order])],
  providers: [CondOrderService],
  controllers: [CondOrderController],
})
export class CondOrderModule {}
