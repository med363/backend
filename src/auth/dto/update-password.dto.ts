import { IsNotEmpty, MinLength, IsEmail } from 'class-validator';

export class UpdatePasswordDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  currentPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;

  @IsNotEmpty()
  @MinLength(6)
  confirmPassword: string;
}
