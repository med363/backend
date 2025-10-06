import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { EmbaucheRequestsService } from './embauche-requests.service';
import { EmbaucheRequestActionDto } from './dto/embauche-request-action.dto';
import { CreateEmbaucheRequestDto } from './dto/create-embauche-request.dto';

@Controller('embauche-requests')
export class EmbaucheRequestsController {
  constructor(private readonly embaucheRequestsService: EmbaucheRequestsService) {}

  @Get('user/:userId')
  async getRequestsForUser(@Param('userId') userId: number) {
    return this.embaucheRequestsService.getRequestsForUser(userId);
  }

  @Get('establishment/:establishmentId')
  async getRequestsForEstablishment(@Param('establishmentId') establishmentId: number) {
    return this.embaucheRequestsService.getRequestsForEstablishment(establishmentId);
  }

  @Post()
  async createRequest(@Body() createDto: CreateEmbaucheRequestDto) {
    return this.embaucheRequestsService.createRequest(createDto);
  }

  @Put(':id/action')
  async handleRequestAction(@Param('id') id: number, @Body() actionDto: EmbaucheRequestActionDto) {
    return this.embaucheRequestsService.handleRequestAction(id, actionDto);
  }

  @Get('pending-count/:userId')
  async getPendingCountForUser(@Param('userId') userId: number) {
    return this.embaucheRequestsService.getPendingCountForUser(userId);
  }
}