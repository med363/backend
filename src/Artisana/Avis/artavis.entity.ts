import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Artisan } from '../../auth/entities/artisan.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('artavis')
export class ArtAvis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  rate: number;

  @Column({ type: 'text' })
  comment: string;

  @ManyToOne(() => Artisan, (artisan) => artisan.artavis, { onDelete: 'CASCADE' })
  artisan: Artisan;

  @ManyToOne(() => User, (user) => user.artisanReviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}
