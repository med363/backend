import { IsNotEmpty, IsEmail, IsNumberString, MinLength, Matches, IsIn, IsOptional, IsString } from 'class-validator';

export class EtablissementRegisterDto {
  @IsNotEmpty()
  type: string; // Startup, Agence, Societe, or custom
  @IsNotEmpty()
  nameOfEtablissement: string; // nom de l'établissement

  @IsEmail()
  email: string;

  @IsNumberString()
  @Matches(/^\d{8,15}$/)
  phone: string;

  // Year only (YYYY)
  @Matches(/^\d{4}$/)
  since: string; // e.g., "2020"

  // Allowed ranges
  @IsIn(['1-10', '10-50', '51-200', '200+'])
  employeesCount: string; // nombre d'employés (plage)
  // New optional field for localisation
  @IsNotEmpty()
  localisation: string; // localisation de l'établissement

  @MinLength(6)
  password: string;

  @MinLength(6)
  confirmPassword: string;




  // Optional image URL or path
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  paymentHistory?: string[];

  @IsOptional()
  subscriptionStatus?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

  // Optional status proof image URL or path
  @IsOptional()
  @IsString()
  imageOfStatusProof?: string;

  // Secteur d'activité
  @IsOptional()
  @IsString()
  secteur?: string;


}
