import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/user.entity';
import { Artisan } from './auth/entities/artisan.entity';
import { Etablissement } from './auth/entities/etablissement.entity';
import { Etoffre } from './etablissements/offre.entity';
import { EtoffreModule } from './etablissements/offre.module'; // 👈 importe le module
import { Order } from './etablissements/order/order.entity';
import { UserSharedOrder } from './etablissements/order/user-shared-order.entity';
import { OrderModule } from './etablissements/order/order.module';
import { ArtOffreModule } from './Artisana/artoffre.module';
import { ArtOffre } from './Artisana/artoffre.entity';
import { ArtAvis } from './Artisana/Avis/artavis.entity';
import { ArtAvisModule } from './Artisana/Avis/artavis.module';
import { UserAvis } from './User/userAvis/useravis.entity';
import { UserAvisModule } from './User/userAvis/useravis.module';
import { PostulerOfferForUser } from './User/postul-offer/postulerofferforuser.entity';
import { PostulerOfferForUserModule } from './User/postul-offer/postulerofferforuser.module';
import { PostulerOfferForArtisana } from './Artisana/Postuler_offer/postulerofferforartisana.entity';
import { PostulerOfferForArtisanaModule } from './Artisana/Postuler_offer/postulerofferforartisana.module';
import { SubscriptionModule } from './Subscription/subscription.module';
import { PaymentModule } from './Payment/payment.module';
import { OAuthModule } from './OAuth/oauth.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'hr_user',
      password: process.env.DATABASE_PASSWORD || 'hr_password',
      database: process.env.DATABASE_NAME || 'hr_database',
      entities: [User, Artisan, Etablissement, Etoffre, Order, UserSharedOrder, ArtOffre, ArtAvis, UserAvis, PostulerOfferForUser, PostulerOfferForArtisana, __dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: process.env.FORCE_SYNC === 'true' || process.env.NODE_ENV !== 'production',
      logging: true,
    }),
    AuthModule,
    EtoffreModule, // 👈 ajoute le module ici
    OrderModule, // 👈 ajoute le module ici
    ArtOffreModule, // 👈 ajoute le module ici
    ArtAvisModule, // 👈 ajoute le module ici
    UserAvisModule, // 👈 ajoute le module ici
    PostulerOfferForUserModule, // 👈 ajoute le module ici
    PostulerOfferForArtisanaModule, // 👈 ajoute le module ici
    SubscriptionModule,
    PaymentModule,  
    OAuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}