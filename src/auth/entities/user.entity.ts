import { Entity, Column, OneToMany } from 'typeorm';
import { ManyToMany, JoinTable } from 'typeorm';
import { Etablissement } from './etablissement.entity';
import { UserAvis } from '../../User/userAvis/useravis.entity';
import { PostulerOfferForUser } from '../../User/postul-offer/postulerofferforuser.entity';
import { BaseUser } from './base-user.entity';
import { BaseProfile } from './base-profile.entity'; // Import BaseProfile
import { ArtAvis } from '../../Artisana/Avis/artavis.entity';

@Entity('users')
export class User extends BaseUser {
  // Inherit BaseProfile fields (cv, github, portfolio, linkdin)
  // Optional proof of work image URL or path
  @Column({ type: 'varchar', nullable: true })
  imageProofOfWork?: string;
  
  @Column({ default: 'user' })
  role: string; // generic simple user

  // Subscription fields
  @Column({ type: 'varchar', default: 'standard' })
  subscriptionPlan: string; // 'standard' or 'premium'

  @Column({ type: 'enum', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' })
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

  @Column({ type: 'simple-array', nullable: true })
  paymentHistory?: string[];

  @Column({ type: 'varchar', default: 'non_payed' })
  paymentStatus: string; // 'payed', 'non_payed'

  @Column({ type: 'timestamp', nullable: true })
  subscriptionStartDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEndDate?: Date;

  
  @OneToMany(() => UserAvis, (avis: UserAvis) => avis.user)
  useravis: UserAvis[];

  @OneToMany(() => ArtAvis, (avis: ArtAvis) => avis.user)
  artisanReviews: ArtAvis[];

  @OneToMany(() => PostulerOfferForUser, (postuler) => postuler.user)
  postuleroffers: PostulerOfferForUser[];

  // ManyToMany embauche relation with Etablissement
  @ManyToMany(() => Etablissement, (etab) => etab.embauchedUsers, { cascade: true })
  @JoinTable({ name: 'user_etablissement_embauche' })
  embauchedEtablissements: Etablissement[];
}