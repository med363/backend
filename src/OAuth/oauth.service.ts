import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../auth/entities/user.entity';
import { Artisan } from '../auth/entities/artisan.entity';
import { Etablissement } from '../auth/entities/etablissement.entity';

@Injectable()
export class OAuthService {
  async validateOAuthLogin(profile: any, provider: string): Promise<User | Artisan | Etablissement> {
    // Implement logic to find or create user/artisan/etablissement by Google profile
    // Example: check email, create if not exists, return entity
    // You may want to add a 'provider' and 'providerId' field to your entities
  // If no user/artisan/etablissement is found, throw instead of returning null
  throw new UnauthorizedException('No user found for this Google account');
  }
}
