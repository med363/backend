// ...existing code...
import { Controller, Post, Put, Delete, Get, Body, Param } from '@nestjs/common';
import { EtoffreService } from './offre.service';
import { Etoffre } from './offre.entity';
import { EtbOffreDto } from './etb-offre.dto';

@Controller('etoffres')
export class EtoffreController {
  constructor(private readonly etoffreService: EtoffreService) {}

  @Get()
  async findAll(): Promise<any[]> {
    const offres = await this.etoffreService.findAll();
    return offres.map(o => ({
      id: o.id,
      titre: o.titre,
      description: o.description,
      typeContrat: o.typeContrat,
      skills: o.skills,
      budget: o.budget,
      etablissement: o.etablissement
        ? {
            id: o.etablissement.id,
            name: o.etablissement.nameOfEtablissement || 'Nom inconnu',
          }
        : { id: null, name: 'Nom inconnu' },
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Etoffre | null> {
    return this.etoffreService.findOne(id);
  }

  @Get('by-etablissement/:etablissementId')
  async findByEtablissement(@Param('etablissementId') etablissementId: number): Promise<any[]> {
    // Use service to filter offers by etablissementId
    const offres = await this.etoffreService.findAll();
    return offres
      .filter(o => o.etablissement?.id === Number(etablissementId))
      .map(o => ({
        id: o.id,
        titre: o.titre,
        description: o.description,
        typeContrat: o.typeContrat,
        skills: o.skills,
        budget: o.budget,
        etablissement: o.etablissement
          ? {
              id: o.etablissement.id,
              name: o.etablissement.nameOfEtablissement || 'Nom inconnu',
            }
          : { id: null, name: 'Nom inconnu' },
      }));
  }

@Post()
async create(@Body() body: any): Promise<Etoffre> {
  console.log("Payload reçu pour offre:", body);  // 👈 Debug pour voir ce que le front envoie

  // Transforme le body pour toujours avoir etablissementId
  const dto: EtbOffreDto = {
    titre: body.titre,
    description: body.description,
    typeContrat: body.typeContrat,
    skills: body.skills,
    budget: body.budget,
    etablissementId: body.etablissementId || (body.etablissement && body.etablissement.id),
  };

  console.log("DTO préparé pour service:", dto);  // 👈 Debug pour confirmer que etablissementId est bien là

  return this.etoffreService.create(dto);
}

  @Put(':id')
  async update(@Param('id') id: number, @Body() body: any): Promise<Etoffre | null> {
    let dto: EtbOffreDto = {
      titre: body.titre,
      description: body.description,
      typeContrat: body.typeContrat,
      skills: body.skills,
      budget: body.budget,
      etablissementId: body.etablissementId || (body.etablissement && body.etablissement.id),
    };
    return this.etoffreService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<{ success: boolean }> {
    await this.etoffreService.delete(id);
    return { success: true };
  }
}
