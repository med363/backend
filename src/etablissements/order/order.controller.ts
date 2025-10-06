import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderDto, UpdateOrderStatusDto, ToggleOrderSharingDto } from './order.dto';

@Controller('etablissement/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() dto: OrderDto) {
    return this.orderService.create(dto);
  }

  @Get()
  async findAll() {
    return this.orderService.findAll();
  }

  @Get('by-etablissement/:etablissementId')
  async findByEtablissement(@Param('etablissementId') etablissementId: number) {
    return this.orderService.findByEtablissement(etablissementId);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.orderService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: Partial<OrderDto>) {
    return this.orderService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    await this.orderService.delete(id);
    return { success: true };
  }

  @Get('user/:userId')
  async findOrdersForUser(@Param('userId') userId: number) {
    return this.orderService.findOrdersForUser(userId);
  }

  @Put('update-status/:id')
  async updateStatus(@Param('id') id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }

  @Put('toggle-sharing/:id')
  async toggleSharing(@Param('id') id: number, @Body() dto: ToggleOrderSharingDto) {
    return this.orderService.toggleSharing(id, dto.sharedWithAcceptedUsers);
  }

  @Get('shared-with-accepted/:etablissementId')
  async findSharedOrdersForEstablishment(@Param('etablissementId') etablissementId: number) {
    return this.orderService.findSharedOrdersForEstablishment(etablissementId);
  }

  @Put('user-update-status/:id')
  async userUpdateStatus(@Param('id') id: number, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }

  @Delete('remove-completed/:id')
  async removeCompletedOrder(@Param('id') id: number) {
    return this.orderService.removeCompletedOrder(id);
  }

  @Get('approaching-deadline/:etablissementId')
  async getOrdersApproachingDeadline(@Param('etablissementId') etablissementId: number) {
    return this.orderService.getOrdersApproachingDeadline(etablissementId);
  }
}
