import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyResetCodeDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  confirmPassword: string;
}
