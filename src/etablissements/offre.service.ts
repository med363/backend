import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Etoffre } from './offre.entity';
import { Etablissement } from '../auth/entities/etablissement.entity';

@Injectable()
export class EtoffreService {
  constructor(
    @InjectRepository(Etoffre)
    private readonly etoffreRepository: Repository<Etoffre>,
  ) {}

  async findAll(): Promise<Etoffre[]> {
    return this.etoffreRepository.find({ relations: ['etablissement'] });
  }

  async findOne(id: number): Promise<Etoffre | null> {
    return this.etoffreRepository.findOne({ where: { id }, relations: ['etablissement'] });
  }

  async create(data: Partial<Etoffre> & { etablissementId?: number }): Promise<Etoffre> {
    if (!data.etablissementId) {
      throw new BadRequestException("L'id de l'etablissement est requis");
    }

    const etablissement = await this.etoffreRepository.manager.findOne(Etablissement, {
      where: { id: data.etablissementId },
    });

    if (!etablissement) {
  throw new NotFoundException("L'id de l'etablissement est introuvable");
    }

const etoffre = this.etoffreRepository.create({
  titre: data.titre,
  description: data.description,
  typeContrat: data.typeContrat , // ✅ handles empty string
  skills: data.skills ,       // ✅ handles empty string
  budget: data.budget,
  etablissement,
});

    return this.etoffreRepository.save(etoffre);
  }

  async update(id: number, data: Partial<Etoffre> & { etablissementId?: number }): Promise<Etoffre | null> {
    if (data.etablissementId) {
      const etablissement = await this.etoffreRepository.manager.findOne(Etablissement, {
        where: { id: data.etablissementId },
      });
      if (!etablissement) throw new NotFoundException('Etablissement not found');
      data.etablissement = etablissement;
    }

    await this.etoffreRepository.update(id, data);
    return this.etoffreRepository.findOne({ where: { id }, relations: ['etablissement'] });
  }

  async delete(id: number): Promise<void> {
    await this.etoffreRepository.delete(id);
  }
}
