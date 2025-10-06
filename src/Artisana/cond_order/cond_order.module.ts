import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CondOrderService } from './cond_order.service';
import { CondOrderController } from './cond_order.controller';
import { Order } from '../../etablissements/order/order.entity';
import { Artisan } from '../../auth/entities/artisan.entity';
import { Etablissement } from '../../auth/entities/etablissement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Artisan, Etablissement])],
  providers: [CondOrderService],
  controllers: [CondOrderController],
})
export class CondOrderModule {}
