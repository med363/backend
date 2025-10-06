import { IsString, IsInt, IsDateString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { OrderStatus } from './order.entity';

export class OrderDto {
  @IsString()
  demande: string;

  @IsString()
  @IsOptional()
  priorite?: string;

  @IsDateString()
  date: string;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsInt()
  etablissementId: number;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsBoolean()
  @IsOptional()
  sharedWithAcceptedUsers?: boolean;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class ToggleOrderSharingDto {
  @IsBoolean()
  sharedWithAcceptedUsers: boolean;
}
