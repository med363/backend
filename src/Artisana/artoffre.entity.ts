
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
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
  imageProofOfWork?: string;

  @Column({ type: 'text', nullable: true })
  images?: string;

  @ManyToOne(() => Artisan, (artisan) => artisan.artoffres, { onDelete: 'CASCADE' })
  artisan: Artisan;
}
