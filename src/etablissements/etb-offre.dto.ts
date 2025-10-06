// DTO for creating/updating EtbOffre
import { IsString, IsNotEmpty, IsNumber, IsInt } from 'class-validator';

export class EtbOffreDto {
  @IsString()
  @IsNotEmpty()
  titre: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  typeContrat: string;

  @IsString()
  @IsNotEmpty()
  skills: string;

  @IsNumber()
  budget: number;

  @IsInt()
  etablissementId: number;
}
