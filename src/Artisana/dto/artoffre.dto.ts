import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class ArtOffreDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  prix: number;

  @IsNotEmpty()
  artisanId: number;

  @IsOptional()
  @IsString()
  imageProofOfWork?: string;

  @IsOptional()
  images?: string[];
}