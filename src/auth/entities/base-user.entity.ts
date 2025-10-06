// entities/base-user.entity.ts
import { PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseProfile } from './base-profile.entity';

export abstract class BaseUser extends BaseProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'varchar' })
  lastName?: string;

  @Column({ nullable: true, type: 'varchar' })
  firstName?: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, type: 'varchar' })
  phone?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column()
  password: string;

  @Column()
  confirmPassword: string;



  // Optional profile image
  @Column({ type: 'varchar', nullable: true })
  image?: string;
}
