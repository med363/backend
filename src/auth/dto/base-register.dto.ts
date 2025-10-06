import { IsNotEmpty, IsEmail, IsDateString, IsNumberString, MinLength, Matches } from 'class-validator';

export class BaseRegisterDto {
  // Optional CV (PDF or other file) URL or path
  cv?: string;
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

  // Optional image URL or path
  image?: string;

  // Optional proof of work image URL or path
  imageProofOfWork?: string;
}
