import { Controller, Get, Query } from '@nestjs/common';
import { CondOrderService } from './cond_order.service';

@Controller('artisana')
export class CondOrderController {
    constructor(private readonly condOrderService: CondOrderService) {}
    
    @Get()
    async getOrdersIfEmbauche(
        @Query('artisanaId') artisanaId: number,
        @Query('etablissementId') etablissementId: number
    ) {
        return this.condOrderService.getOrdersIfEmbauche(artisanaId, etablissementId);
    }
    @Get('check-embauche')
    async checkEmbauche(
      @Query('artisanaId') artisanaId: number,
      @Query('etablissementId') etablissementId: number
    ) {
      return this.condOrderService.checkEmbauche(artisanaId, etablissementId);
    }
}
