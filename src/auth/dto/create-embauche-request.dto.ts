import { IsInt, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmbaucheRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  offerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  artisanId?: number;

  @Type(() => Number)
  @IsInt()
  etablissementId: number;

  @IsOptional()
  @IsEnum(['pending', 'accepted', 'refused'])
  status?: 'pending' | 'accepted' | 'refused';
}