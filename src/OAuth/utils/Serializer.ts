import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Serializer extends PassportSerializer {
  serializeUser(user: any, done: Function) {
    done(null, user);
  }

  deserializeUser(payload: any, done: Function) {
    done(null, payload);
  }
}
