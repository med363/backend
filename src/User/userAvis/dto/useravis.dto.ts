import { IsNotEmpty, IsInt, IsString } from 'class-validator';

export class UserAvisDto {
  @IsNotEmpty()
  @IsInt()
  rate: number;

  @IsNotEmpty()
  @IsString()
  comment: string;

  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsNotEmpty()
  @IsInt()
  artisanId: number;
}
