import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Artisan } from './artisan.entity';
import { Etablissement } from './etablissement.entity';

@Entity('embauche_requests')
export class EmbaucheRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  offerId?: number;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @ManyToOne(() => Artisan, { nullable: true })
  artisan: Artisan;

  @ManyToOne(() => Etablissement)
  etablissement: Etablissement;

  @Column({ type: 'enum', enum: ['pending', 'accepted', 'refused'], default: 'pending' })
  status: 'pending' | 'accepted' | 'refused';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}