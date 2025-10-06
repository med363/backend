// postulerofferforuser.dto.ts
import { IsOptional, IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PostulerOfferForUserDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  offerId: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @IsOptional()
  @IsString()
  cv?: string;

  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  portfolio?: string;

  @IsOptional()
  @IsString()
  linkdin?: string;

  @IsOptional()
  paymentHistory?: string[];

  @IsOptional()
  subscriptionStatus?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}