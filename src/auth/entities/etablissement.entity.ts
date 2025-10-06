import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ManyToMany } from 'typeorm';
import { Artisan } from './artisan.entity';
import { User } from './user.entity';
import { Etoffre } from '../../etablissements/offre.entity';
import { Order } from '../../etablissements/order/order.entity';

@Entity('etablissements')
export class Etablissement {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Etoffre, (etoffre) => etoffre.etablissement)
  etoffres: Etoffre[];

  @OneToMany(() => Order, (order) => order.etablissement)
  orders: Order[];

  @Column({ type: 'varchar' })
  nameOfEtablissement: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  since?: string; // YYYY only

  @Column({ type: 'varchar', nullable: true })
  employeesCount?: string; // e.g., '1-10', '10-50', '51-200', '200+'

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar' })
  confirmPassword: string;

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


  // Type of etablissement: Startup, Agence, Societe
  @Column({ type: 'enum', enum: ['Startup', 'Agence', 'Societe'], default: 'Startup' })
  type: string;

  @Column({ type: 'varchar', nullable: true })
  localisation?: string;

  // Optional image URL or path
  @Column({ type: 'varchar', nullable: true })
  image?: string;

  // Optional status proof image URL or path
  @Column({ type: 'varchar', nullable: true })
  imageOfStatusProof?: string;

  // Secteur d'activité
  @Column({ type: 'varchar', nullable: true })
  secteur?: string;

  // Notification: has new postulant
  @Column({ type: 'boolean', default: false })
  hasNewPostulant: boolean;

  // ManyToMany embauche relation with Artisan
  @ManyToMany(() => Artisan, (artisan) => artisan.embauchedEtablissements)
  embauchedArtisans: Artisan[];

  // ManyToMany embauche relation with User
  @ManyToMany(() => User, (user) => user.embauchedEtablissements)
  embauchedUsers: User[];
}
