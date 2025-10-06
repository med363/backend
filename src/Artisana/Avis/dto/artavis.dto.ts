import { IsNotEmpty, IsString, IsInt, Min, Max } from 'class-validator';

export class ArtAvisDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rate: number;

  @IsNotEmpty()
  @IsString()
  comment: string;

  @IsNotEmpty()
  artisanId: number;
}
