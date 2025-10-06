import { IsNotEmpty, IsEmail, MinLength } from 'class-validator';

export class UpdateEmailDto {
  @IsEmail()
  currentEmail: string;

  @IsEmail()
  newEmail: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
