import { Body, Controller, Get, Param, Post, Query, BadRequestException } from '@nestjs/common';
import { ArtAvisService } from './artavis.service';

@Controller('artavis')
export class ArtAvisController {
  constructor(private readonly artavisService: ArtAvisService) {}

//POST artavis/:artisanId?userId=X - create avis for artisan by user
  @Post(':artisanId')
  async createAvisForUser(
    @Param('artisanId') artisanId: number,
    @Query('userId') userId?: string,
    @Query('userID') userIdAlt?: string,
    @Body() body?: { rate?: number; comment?: string },
  ) {
    const resolvedUserId = userId ?? userIdAlt;
    if (!resolvedUserId) {
      throw new BadRequestException('Query parameter "userId" is required');
    }

    if (body?.rate == null || body?.comment == null) {
      throw new BadRequestException('Body must include rate and comment');
    }

    return this.artavisService.createAvisForUser(
      Number(resolvedUserId),
      Number(artisanId),
      Number(body.rate),
      body.comment,
    );
  }



  @Get(':userId')
  async getAllReviewsForUserSimple(@Param('userId') userId: number) {
    return this.artavisService.getAllReviewsForUser(Number(userId));
  }


}
