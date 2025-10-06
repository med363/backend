// postulerofferforuser.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Etablissement } from '../../auth/entities/etablissement.entity';
import { BaseProfile } from '../../auth/entities/base-profile.entity';

@Entity('postulerofferforuser')
export class PostulerOfferForUser extends BaseProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.postuleroffers, { 
    onDelete: 'CASCADE',
    eager: true
  })
  user: User;

  @ManyToOne(() => Etablissement, { 
    onDelete: 'CASCADE',
    eager: true,
    nullable: false
  })
  etablissement: Etablissement;

  @Column({ nullable: false })
  offerId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}