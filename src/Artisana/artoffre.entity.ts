import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Artisan } from '../auth/entities/artisan.entity';

@Entity('artoffres')
export class ArtOffre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'float' })
  prix: number;

  @Column({ type: 'varchar', nullable: true })
  imageProofOfWork: string;

  @Column({ type: 'text', nullable: true })
  images: string;

  // ManyToOne relationship with Artisan
  @ManyToOne(() => Artisan, (artisan) => artisan.artoffres, { 
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'artisanId' }) // This creates the foreign key
  artisan: Artisan;

  // Add this column - it's required for the foreign key
  @Column()
  artisanId: number;
}