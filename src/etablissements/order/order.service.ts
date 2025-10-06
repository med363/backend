import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderDto } from './order.dto';
import { UserSharedOrder } from './user-shared-order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(UserSharedOrder)
    private readonly userSharedOrderRepository: Repository<UserSharedOrder>,
  ) {}

  async create(dto: OrderDto): Promise<Order> {
    console.log('Order payload received:', dto);
    try {
      const order = this.orderRepository.create(dto);
      const savedOrder = await this.orderRepository.save(order);
      console.log('Order saved:', savedOrder);
      return savedOrder;
    } catch (err) {
      console.error('Error saving order:', err);
      throw err;
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find();
  }


  async findByEtablissement(etablissementId: number): Promise<Order[]> {
    return this.orderRepository.find({ where: { etablissementId } });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(id: number, dto: Partial<OrderDto>): Promise<Order> {
    await this.orderRepository.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.orderRepository.delete(id);
  }

  // Share all orders from an establishment with a user (when embauche is accepted)
  async shareEstablishmentOrdersWithUser(etablissementId: number, userId: number): Promise<UserSharedOrder[]> {
    console.log(`Sharing orders from establishment ${etablissementId} with user ${userId}`);
    
    // Get all orders for this establishment
    const orders = await this.findByEtablissement(etablissementId);
    
    const sharedOrders: UserSharedOrder[] = [];
    
    for (const order of orders) {
      // Check if already shared
      const existingSharedOrder = await this.userSharedOrderRepository.findOne({
        where: { orderId: order.id, userId: userId }
      });
      
      if (!existingSharedOrder) {
        const sharedOrder = this.userSharedOrderRepository.create({
          orderId: order.id,
          userId: userId,
          isActive: true
        });
        
        const saved = await this.userSharedOrderRepository.save(sharedOrder);
        sharedOrders.push(saved);
      }
    }
    
    console.log(`Shared ${sharedOrders.length} orders with user ${userId}`);
    return sharedOrders;
  }

  // Get all orders shared with a user
  async findOrdersForUser(userId: number): Promise<UserSharedOrder[]> {
    return this.userSharedOrderRepository.find({
      where: { userId: userId, isActive: true },
      relations: ['order', 'order.etablissement']
    });
  }

  // Update order status
  async updateStatus(id: number, status: string): Promise<Order> {
    console.log(`Updating order ${id} status to ${status}`);
    
    const order = await this.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.orderRepository.update(id, { status: status as any });
    const updatedOrder = await this.findOne(id);
    
    console.log(`Order ${id} status updated successfully`);
    return updatedOrder;
  }

  // Toggle order sharing with accepted users
  async toggleSharing(id: number, sharedWithAcceptedUsers: boolean): Promise<Order> {
    console.log(`Toggling order ${id} sharing to ${sharedWithAcceptedUsers}`);
    
    const order = await this.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.orderRepository.update(id, { sharedWithAcceptedUsers });
    const updatedOrder = await this.findOne(id);
    
    console.log(`Order ${id} sharing updated successfully`);
    return updatedOrder;
  }

  // Get orders that are shared with accepted users for a specific establishment
  async findSharedOrdersForEstablishment(etablissementId: number): Promise<Order[]> {
    return this.orderRepository.find({ 
      where: { 
        etablissementId,
        sharedWithAcceptedUsers: true 
      } 
    });
  }

  // Remove completed order (only if status is 'termine')
  async removeCompletedOrder(id: number): Promise<{ success: boolean; message: string }> {
    console.log(`Attempting to remove completed order ${id}`);
    
    const order = await this.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'termine') {
      return {
        success: false,
        message: 'Only completed orders can be removed'
      };
    }

    await this.orderRepository.delete(id);
    
    // Also remove any associated UserSharedOrder entries
    await this.userSharedOrderRepository.delete({ orderId: id });
    
    console.log(`Order ${id} removed successfully`);
    return {
      success: true,
      message: 'Order removed successfully'
    };
  }

  // Check for orders approaching deadline (within 1 day)
  async getOrdersApproachingDeadline(etablissementId?: number): Promise<any[]> {
    console.log(`Checking orders approaching deadline for establishment ${etablissementId}`);
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.etablissement', 'etablissement')
      .where('order.deadline IS NOT NULL')
      .andWhere('order.deadline <= :tomorrow', { tomorrow: tomorrowStr })
      .andWhere('order.deadline >= :today', { today: todayStr })
      .andWhere('order.status != :status', { status: 'termine' });

    if (etablissementId) {
      query = query.andWhere('order.etablissementId = :etablissementId', { etablissementId });
    }

    const orders = await query.getMany();
    
    return orders.map(order => ({
      ...order,
      daysUntilDeadline: this.calculateDaysUntilDeadline(order.deadline),
      isUrgent: this.calculateDaysUntilDeadline(order.deadline) <= 1
    }));
  }

  // Calculate days until deadline
  private calculateDaysUntilDeadline(deadline: string): number {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
