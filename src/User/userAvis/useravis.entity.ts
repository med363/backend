import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('useravis')
export class UserAvis {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  rate: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'int' })
  artisanId: number;

  @ManyToOne(() => User, (user) => user.useravis, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
