import { IsDateString, IsEmail, IsNotEmpty, IsNumberString, Matches, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class ArtisanaRegisterDto  {

  @IsNotEmpty()
  firstName: string; // prenom

  @IsNotEmpty()
  lastName: string; // nom

  @IsEmail()
  email: string;

  @IsNumberString()
  @Matches(/^\d{8,15}$/)
  phone: string; // telephone

  @IsDateString()
  dateOfBirth: string; // dateNaissance (ISO date string)

  @MinLength(6)
  password: string;

  @MinLength(6)
  confirmPassword: string;

  @IsNotEmpty()
  artisanType: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  artisanExperience?: number;

  @IsOptional()
  artisanCertification?: string;
  @IsOptional()
  disponibilite?: Array<{ day: string; start: string; end: string }>;
  @IsOptional()
  image?: string;

  @IsOptional()
  paymentHistory?: string[];

  @IsOptional()
  subscriptionStatus?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  
}
