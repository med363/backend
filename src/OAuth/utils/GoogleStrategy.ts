import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { OAuthService } from '../oauth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly oAuthService: OAuthService) {
    super({
    clientID: 'dummy', // Required by strategy, not used now
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/redirect',
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }//MUST GCP ACCOUNT BE ENABLED

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const user = await this.oAuthService.validateOAuthLogin(profile, 'google');
    done(null, user);
  }
}
