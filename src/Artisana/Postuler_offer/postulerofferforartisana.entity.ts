import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Artisan } from '../../auth/entities/artisan.entity';

@Entity('postulerofferforartisana')
export class PostulerOfferForArtisana {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ type: 'simple-array', nullable: true })
  imageProofOfWork?: string[];

  @Column({ type: 'varchar', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'float', nullable: true })
  prix?: number;

  @ManyToOne(() => Artisan, { onDelete: 'CASCADE' })
  artisan: Artisan;
}
