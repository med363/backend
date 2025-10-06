import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class ArtOffreCreateDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  prix: number;

  @IsOptional()
  @IsString()
  imageProofOfWork?: string;
}