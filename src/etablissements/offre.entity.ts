// TypeORM entity for Etablissement Offer (PostgreSQL)
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Etablissement } from '../auth/entities/etablissement.entity';

@Entity('etoffres')
export class Etoffre {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 100, default: 'CDI' })
  typeContrat: string;

  @Column({ type: 'varchar', length: 255, default: 'Aucune' })
  skills: string;

  @Column({ type: 'float' })
  budget: number;

  @ManyToOne(() => Etablissement, (etablissement) => etablissement.etoffres, { eager: true })
  etablissement: Etablissement;
}
