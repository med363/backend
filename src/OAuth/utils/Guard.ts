import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') implements CanActivate {
  canActivate(context: ExecutionContext) {
    // Add custom logic if needed
    return super.canActivate(context);
  }
}
