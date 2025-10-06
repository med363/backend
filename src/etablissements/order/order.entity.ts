import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Etablissement } from '../../auth/entities/etablissement.entity';

export enum OrderStatus {
  A_FAIRE = 'a_faire',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
}

@Entity('orders')
export class Order {
  @Column({ type: 'int' })
  etablissementId: number;
  
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  demande: string;

  @Column({ type: 'varchar', length: 20, default: 'normale' })
  priorite: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'date', nullable: true })
  deadline: string;

  @Column({ 
    type: 'enum', 
    enum: OrderStatus, 
    default: OrderStatus.A_FAIRE 
  })
  status: OrderStatus;

  @Column({ type: 'boolean', default: false })
  sharedWithAcceptedUsers: boolean;

  @ManyToOne(() => Etablissement, (etablissement) => etablissement.orders, { eager: true })
  @JoinColumn({ name: 'etablissementId' })
  etablissement: Etablissement;
}
