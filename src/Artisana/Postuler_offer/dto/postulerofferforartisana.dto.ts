import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
export class PostulerOfferForArtisanaDto {
  artisanId: number;
  imageProofOfWork?: string[];
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  @IsNumber()
  @Min(1)
  prix: number;
}
