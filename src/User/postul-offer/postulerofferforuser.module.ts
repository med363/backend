// postulerofferforuser.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostulerOfferForUser } from './postulerofferforuser.entity';
import { User } from '../../auth/entities/user.entity';
import { PostulerOfferForUserService } from './postulerofferforuser.service';
import { PostulerOfferForUserController } from './postulerofferforuser.controller';
import { Etablissement } from '../../auth/entities/etablissement.entity';
import { EmbaucheRequest } from '../../auth/entities/embauche-request.entity'; // Add this

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostulerOfferForUser, 
      User, 
      Etablissement,
      EmbaucheRequest // Add this
    ]), 
    AuthModule
  ],
  providers: [PostulerOfferForUserService],
  controllers: [PostulerOfferForUserController],
})
export class PostulerOfferForUserModule {}