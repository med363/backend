import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Controller('cond-order')
export class CondOrderController {
  constructor(private readonly authService: AuthService) {}

  @Get('check-embauche')
  async checkEmbauche(
    @Query('userId') userId: string,
    @Query('artisanId') artisanId: string,
    @Query('etablissementId') etablissementId: string
  ) {
    let isEmbauche = false;
    // If etablissementId is missing or empty, always return false
    if (!etablissementId || etablissementId.trim() === '') {
      return { isEmbauche: false };
    }
    // If both userId and artisanId are missing or empty, always return false
    if ((!userId || userId.trim() === '') && (!artisanId || artisanId.trim() === '')) {
      return { isEmbauche: false };
    }
    if (userId && userId.trim() !== '') {
      isEmbauche = await this.authService.isUserEmbauchedToEtablissement(Number(userId), Number(etablissementId));
    } else if (artisanId && artisanId.trim() !== '') {
      isEmbauche = await this.authService.isArtisanEmbauchedToEtablissement(Number(artisanId), Number(etablissementId));
    }
    return { isEmbauche };
  }
}
