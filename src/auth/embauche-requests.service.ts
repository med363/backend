import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmbaucheRequest } from './entities/embauche-request.entity';
import { EmbaucheRequestActionDto } from './dto/embauche-request-action.dto';
import { CreateEmbaucheRequestDto } from './dto/create-embauche-request.dto';

@Injectable()
export class EmbaucheRequestsService {
  constructor(
    @InjectRepository(EmbaucheRequest)
    private embaucheRequestRepository: Repository<EmbaucheRequest>,
  ) {}

  async getRequestsForUser(userId: number): Promise<EmbaucheRequest[]> {
    return this.embaucheRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.artisan', 'artisan')
      .leftJoinAndSelect('artisan.user', 'artisanUser')
      .leftJoinAndSelect('request.etablissement', 'etablissement')
      .where('user.id = :userId OR artisanUser.id = :userId', { userId })
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }

  async getRequestsForEstablishment(establishmentId: number): Promise<EmbaucheRequest[]> {
    return this.embaucheRequestRepository.find({
      where: { etablissement: { id: establishmentId } },
      relations: ['user', 'artisan', 'artisan.user', 'etablissement'],
      order: { createdAt: 'DESC' }
    });
  }

  async createRequest(createDto: CreateEmbaucheRequestDto): Promise<EmbaucheRequest> {
    const request = this.embaucheRequestRepository.create(createDto);
    const savedRequest = await this.embaucheRequestRepository.save(request);
    return savedRequest;
  }

  async handleRequestAction(id: number, actionDto: EmbaucheRequestActionDto): Promise<EmbaucheRequest> {
    const request = await this.embaucheRequestRepository.findOne({
      where: { id },
      relations: ['user', 'artisan', 'etablissement']
    });

    if (!request) {
      throw new NotFoundException('Embauche request not found');
    }

    request.status = actionDto.action;
    const updatedRequest = await this.embaucheRequestRepository.save(request);
    return updatedRequest;
  }

  async getPendingCountForUser(userId: number): Promise<{ count: number }> {
    const count = await this.embaucheRequestRepository
      .createQueryBuilder('request')
      .leftJoin('request.user', 'user')
      .leftJoin('request.artisan', 'artisan')
      .leftJoin('artisan.user', 'artisanUser')
      .where('(user.id = :userId OR artisanUser.id = :userId) AND request.status = :status', 
        { userId, status: 'pending' })
      .getCount();

    return { count };
  }

  async getNewRequestsSinceDate(userId: number, sinceDate: Date): Promise<EmbaucheRequest[]> {
    return this.embaucheRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.artisan', 'artisan')
      .leftJoinAndSelect('artisan.user', 'artisanUser')
      .leftJoinAndSelect('request.etablissement', 'etablissement')
      .where('(user.id = :userId OR artisanUser.id = :userId) AND request.status = :status AND request.createdAt >= :sinceDate', 
        { userId, status: 'pending', sinceDate })
      .orderBy('request.createdAt', 'DESC')
      .getMany();
  }
}