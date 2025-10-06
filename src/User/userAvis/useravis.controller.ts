import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserAvisService } from './useravis.service';
import { UserAvisDto } from './dto/useravis.dto';

@Controller('useravis')
export class UserAvisController {
  constructor(private readonly userAvisService: UserAvisService) {}

  // GET useravis/all - get all reviews from database (for debugging)
  @Get('all')
  async getAllReviews() {
    return this.userAvisService.getAllReviews();
  }

  // GET useravis/user/:userId - get all reviews by a specific user
  @Get('user/:userId')
  async getByUser(@Param('userId') userId: number) {
    return this.userAvisService.getAvisByUser(userId);
  }

  // POST useravis/:userId?artisanID=X - create avis for artisan by user
  @Post(':userId')
  async createAvisForArtisan(
    @Param('userId') userId: number,
    @Query('artisanID') artisanId: number,
    @Body() body: { rate: number; comment: string }
  ) {
    return this.userAvisService.createAvisForArtisan(userId, artisanId, body.rate, body.comment);
  }

  // GET useravis/:artisanId - get all reviews for specific artisan (main route)
  @Get(':artisanId')
  async getAllReviewsForArtisan(@Param('artisanId') artisanId: number) {
    return this.userAvisService.getAllReviewsForArtisan(artisanId);
  }
}
