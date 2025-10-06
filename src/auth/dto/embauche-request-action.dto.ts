import { IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class EmbaucheRequestActionDto {
  @Type(() => Number)
  @IsInt({ message: 'requestId must be a valid number' })
  requestId: number;

  @IsEnum(['accepted', 'refused'])
  action: 'accepted' | 'refused';
}
