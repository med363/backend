// base-profile.entity.ts
import { Column } from 'typeorm';

export abstract class BaseProfile {
  @Column({ type: 'varchar', nullable: true })
  cv?: string;

  @Column({ type: 'varchar', nullable: true })
  github?: string;

  @Column({ type: 'varchar', nullable: true })
  portfolio?: string;

  @Column({ type: 'varchar', nullable: true })
  linkdin?: string;
}