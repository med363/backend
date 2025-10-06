import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Controller('auth/google')
export class OAuthController {
  @Get()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth2 login
  }

  @Get('redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request) {
    // Handle Google OAuth2 callback
    // Type assertion to fix TS error: Property 'user' does not exist on type 'Request'
    return (req as any).user;
  }
}
