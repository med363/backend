import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAvis } from './useravis.entity';
import { User } from '../../auth/entities/user.entity';
import { UserAvisService } from './useravis.service';
import { UserAvisController } from './useravis.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserAvis, User])],
  providers: [UserAvisService],
  controllers: [UserAvisController],
})
export class UserAvisModule {}
