import { Query } from '@nestjs/common';

import { Controller, Get, Param } from '@nestjs/common';
import { CondOrderService } from './cond_order.service';

@Controller('cond-order')
export class CondOrderController {
  constructor(private readonly condOrderService: CondOrderService) {}

  @Get('etablissement/:etablissementId/user/:userId')
  async getOrdersIfUserEmployed(
    @Param('etablissementId') etablissementId: number,
    @Param('userId') userId: number
  ) {
    return this.condOrderService.getOrdersIfUserEmployed(etablissementId, userId);
  }
    @Get('check-embauche')
  async checkEmbauche(
    @Query('userId') userId: number,
    @Query('etablissementId') etablissementId: number
  ) {
    return this.condOrderService.checkEmbauche(userId, etablissementId);
  }
}
