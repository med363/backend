import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SubscriptionCheckerService } from './subscription-checker.service';
import { EmbaucheRequestsService } from './embauche-requests.service';
import { EmbaucheRequestsController } from './embauche-requests.controller';
import { User } from './entities/user.entity';
import { Artisan } from './entities/artisan.entity';
import { Etablissement } from './entities/etablissement.entity';
import { MailModule } from '../mail/mail.module';
import { EmbaucheRequest } from './entities/embauche-request.entity';
import { OrderModule } from '../etablissements/order/order.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Artisan, Etablissement, EmbaucheRequest]), 
        MailModule,
        forwardRef(() => OrderModule),
    ],
    providers: [AuthService, SubscriptionCheckerService, EmbaucheRequestsService],
    controllers: [AuthController, EmbaucheRequestsController],
    exports: [AuthService, SubscriptionCheckerService, EmbaucheRequestsService],
})
export class AuthModule {}
