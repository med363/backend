import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { GoogleStrategy } from './utils/GoogleStrategy';
import { Serializer } from './utils/Serializer';

@Module({
  imports: [PassportModule.register({ session: true })],
  providers: [OAuthService, GoogleStrategy, Serializer],
  controllers: [OAuthController],
  exports: [OAuthService],
})
export class OAuthModule {}
