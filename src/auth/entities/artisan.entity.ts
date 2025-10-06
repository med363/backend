import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ManyToMany, JoinTable } from 'typeorm';
import { Etablissement } from './etablissement.entity';
import { ArtOffre } from '../../Artisana/artoffre.entity';
import { ArtAvis } from '../../Artisana/Avis/artavis.entity';

@Entity('artisans')
export class Artisan {
  // Optional proof of work image URL or path
  @Column({ type: 'varchar', nullable: true })
  imageProofOfWork?: string;

  @PrimaryGeneratedColumn()
  id: number;

  // Last name (frontend: lastName)
  @Column({ nullable: true, type: 'varchar' })
  lastName?: string;

  // First name (frontend: firstName)
  @Column({ nullable: true, type: 'varchar' })
  firstName?: string;

  @Column({ unique: true })
  email: string;

  // Phone number (frontend: phone)
  @Column({ nullable: true, type: 'varchar' })
  phone?: string;

  // Date of birth (frontend: dateOfBirth, ISO string)
  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column()
  password: string;
  @Column()
  confirmPassword: string;

  // Required artisan specialty/type (frontend: artisanType / specialty)
  @Column({ type: 'varchar', nullable: false })
  artisanType: string;

  // Optional years of experience
  @Column({ type: 'int', nullable: true })
  artisanExperience?: number;

  // Optional certification text
  @Column({ type: 'varchar', nullable: true })
  artisanCertification?: string;

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


  // Disponibilite: list of available days and time intervals
  // Example: [ { day: 'Monday', start: '08:00', end: '17:00' }, ... ]
  @Column({ type: 'json', nullable: true })
  disponibilite?: Array<{ day: string; start: string; end: string }>;

  // Optional image URL or path
  @Column({ type: 'varchar', nullable: true })
  image?: string;

  @OneToMany(() => ArtOffre, (offre) => offre.artisan)
  artoffres: ArtOffre[];

  @OneToMany(() => ArtAvis, (avis) => avis.artisan)
  artavis: ArtAvis[];

  // ManyToMany embauche relation with Etablissement
  @ManyToMany(() => Etablissement, (etab) => etab.embauchedArtisans, { cascade: true })
  @JoinTable({ name: 'artisan_etablissement_embauche' })
  embauchedEtablissements: Etablissement[];
}
