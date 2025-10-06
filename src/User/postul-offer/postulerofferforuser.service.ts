import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostulerOfferForUser } from './postulerofferforuser.entity';
import { User } from '../../auth/entities/user.entity';
import { Etablissement } from '../../auth/entities/etablissement.entity';
import { PostulerOfferForUserDto } from './dto/postulerofferforuser.dto';

@Injectable()
export class PostulerOfferForUserService {
  constructor(
    @InjectRepository(PostulerOfferForUser) 
    private readonly postulerRepo: Repository<PostulerOfferForUser>,
    @InjectRepository(User) 
    private readonly userRepo: Repository<User>,
    @InjectRepository(Etablissement) 
    private readonly etabRepo: Repository<Etablissement>,
    private readonly authService: AuthService,
  ) {}

  async getPostulantById(id: number) {
    return this.postulerRepo.findOne({ where: { id }, relations: ['user', 'etablissement'] });
  }

  async create(dto: PostulerOfferForUserDto, etablissementId: number) {
    console.log('🔍 DEBUG - PostulerService.create called with:', {
      dto,
      etablissementId,
      types: {
        userId: typeof dto.userId,
        offerId: typeof dto.offerId
      }
    });

    // Manual number conversion as fallback
    const userId = Number(dto.userId);
    const offerId = Number(dto.offerId);
    
    if (isNaN(userId) || isNaN(offerId)) {
      throw new BadRequestException('userId and offerId must be valid numbers');
    }

    // Find user
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Find establishment
    const etablissement = await this.etabRepo.findOne({ 
      where: { id: etablissementId } 
    });
    if (!etablissement) {
      throw new NotFoundException(`Etablissement with ID ${etablissementId} not found`);
    }

    // Check if user already applied to this offer
    const existingApplication = await this.postulerRepo.findOne({
      where: {
        user: { id: userId },
        etablissement: { id: etablissementId },
        offerId: offerId
      }
    });

    if (existingApplication) {
      throw new BadRequestException('User has already applied to this offer');
    }

    // Set notification flag
    etablissement.hasNewPostulant = true;
    await this.etabRepo.save(etablissement);
    
    console.log('🏢 Setting etablissement notification:', {
      etablissementId: etablissement.id,
      etablissementName: etablissement.nameOfEtablissement
    });

    // Create postuler entity
    const postuler = this.postulerRepo.create({
      cv: dto.cv,
      github: dto.github,
      portfolio: dto.portfolio,
      linkdin: dto.linkdin,
      user,
      etablissement,
      offerId: offerId
    });

    const saved = await this.postulerRepo.save(postuler);
    
    console.log('✅ Saved postuler with etablissement:', {
      postulerId: saved.id,
      hasEtablissement: !!saved.etablissement,
      etablissementId: saved.etablissement?.id
    });

    // Create embauche request
    console.log('🎯 Creating embauche request with offerId:', offerId);
    
    try {
      const embaucheRes = await this.authService.createUserEmbaucheRequest(
        userId,
        etablissementId,
        {
          cv: dto.cv,
          github: dto.github,
          portfolio: dto.portfolio,
          linkdin: dto.linkdin
        },
        offerId
      );

      return { 
        success: true,
        postuler: saved,
        embaucheRequest: embaucheRes 
      };
    } catch (error) {
      // If embauche request fails, delete the postuler entry to maintain consistency
      await this.postulerRepo.delete(saved.id);
      throw new BadRequestException(`Failed to create embauche request: ${error.message}`);
    }
  }

  async getByUser(userId: number) {
    return this.postulerRepo.find({ 
      where: { user: { id: userId } }, 
      relations: ['user', 'etablissement'] 
    });
  }

  async getAllPostulantsWithRequests() {
    try {
      const postulants = await this.postulerRepo
        .createQueryBuilder('postuler')
        .leftJoinAndSelect('postuler.user', 'user')
        .leftJoinAndSelect('postuler.etablissement', 'etablissement')
        .leftJoinAndMapMany(
          'postuler.embaucheRequests',
          'EmbaucheRequest',
          'embauche',
          'embauche.userId = user.id AND embauche.etablissementId = etablissement.id'
        )
        .getMany();

      return postulants;
    } catch (error) {
      console.error('Error fetching postulants with requests:', error);
      throw new BadRequestException('Failed to fetch postulants');
    }
  }

  async getAllPostulants() {
    const postulants = await this.postulerRepo.find({ 
      relations: ['user', 'etablissement'] 
    });

    const postulantsWithRequests = await Promise.all(
      postulants.map(async (postulant) => {
        try {
          const embaucheRequests = await this.authService.getAllEmbaucheRequestsForEtablissement(
            postulant.etablissement?.id
          );
          
          const userEmbaucheRequests = embaucheRequests.filter(
            req => req.user?.id === postulant.user.id
          );

          return {
            ...postulant,
            embaucheRequests: userEmbaucheRequests.map(req => ({
              requestId: req.id,
              user: req.user ? req.user.id : null,
              artisan: req.artisan ? req.artisan.id : null,
              etablissement: req.etablissement ? req.etablissement.id : null,
              status: req.status,
              createdAt: req.createdAt,
              updatedAt: req.updatedAt
            }))
          };
        } catch (error) {
          console.error(`Error fetching requests for user ${postulant.user.id}:`, error);
          return {
            ...postulant,
            embaucheRequests: []
          };
        }
      })
    );

    return postulantsWithRequests;
  }

  async resetNotification(etablissementId: number) {
    const etablissement = await this.etabRepo.findOne({ 
      where: { id: etablissementId } 
    });
    
    if (!etablissement) {
      throw new NotFoundException(`Etablissement with ID ${etablissementId} not found`);
    }
    
    etablissement.hasNewPostulant = false;
    await this.etabRepo.save(etablissement);
    
    return { 
      success: true,
      message: `Notifications reset for establishment ${etablissementId}`
    };
  }

  // Add method to check if user has applied
  async checkIfApplied(offerId: number, userId: number) {
    const application = await this.postulerRepo.findOne({
      where: {
        offerId,
        user: { id: userId }
      },
      relations: ['etablissement']
    });

    return {
      hasApplied: !!application,
      status: application ? 'pending' : null
    };
  }
}