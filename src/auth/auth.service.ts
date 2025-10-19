import { Injectable, BadRequestException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRegisterDto } from './dto/base-register.dto';
import { EtablissementRegisterDto } from './dto/etablissement-register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';
import { Artisan } from './entities/artisan.entity';
import { Etablissement } from './entities/etablissement.entity';
import { Role } from './roles.enum';
import { MailService } from '../mail/mail.service';
import { ArtOffre } from '../Artisana/artoffre.entity';
import { EmbaucheRequest } from './entities/embauche-request.entity';
import { OrderService } from '../etablissements/order/order.service';
import { SubscriptionCheckerService } from './subscription-checker.service';

@Injectable()
export class AuthService {
  // --- Password Reset ---
  private resetCodes: Map<string, string> = new Map(); // email -> code

  async requestResetPasswordCode(email: string) {
    // Check if user exists
    const user = await this.userRepo.findOne({ where: { email } }) ||
      await this.artisanRepo.findOne({ where: { email } }) ||
      await this.etabRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Email not found');

    // Generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetCodes.set(email, code);

  // Send code by email (custom for password reset)
  await this.mailService.sendPasswordResetCode(email, code);
    return { message: 'Code sent to email' };
  }

  async verifyResetPasswordCode(email: string, code: string) {
    const savedCode = this.resetCodes.get(email);
    if (!savedCode || savedCode !== code) {
      throw new BadRequestException('Invalid code');
    }
    return { message: 'Code verified' };
  }

  async resetPasswordWithCode(email: string, code: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const savedCode = this.resetCodes.get(email);
    if (!savedCode || savedCode !== code) {
      throw new BadRequestException('Invalid code');
    }
    let user: any = await this.userRepo.findOne({ where: { email } });
    let repo: any = this.userRepo;
    if (!user) {
      user = await this.artisanRepo.findOne({ where: { email } });
      repo = this.artisanRepo;
    }
    if (!user) {
      user = await this.etabRepo.findOne({ where: { email } });
      repo = this.etabRepo;
    }
    if (!user) throw new BadRequestException('User not found');
    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.hash(newPassword, 10);
    await repo.update(user.id, { password: hashed, confirmPassword: hashed });
    this.resetCodes.delete(email);
    return { message: 'Password reset successful' };
  }
  private readonly allowedPaymentStatuses = ['payed', 'non_payed'] as const;

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Artisan) private readonly artisanRepo: Repository<Artisan>,
    @InjectRepository(Etablissement) private readonly etabRepo: Repository<Etablissement>,
    @InjectRepository(EmbaucheRequest) private readonly embaucheRequestRepo: Repository<EmbaucheRequest>,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => OrderService)) private readonly orderService: OrderService,
    @Inject(forwardRef(() => SubscriptionCheckerService)) private readonly subscriptionChecker: SubscriptionCheckerService,
  ) {}

  // --- Check if user is embauched to etablissement ---
  async isUserEmbauchedToEtablissement(userId: number, etablissementId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['embauchedEtablissements'] });
    if (!user) return false;
    return !!user.embauchedEtablissements?.some(e => e.id === etablissementId);
  }

  // --- Check if artisan is embauched to etablissement ---
  async isArtisanEmbauchedToEtablissement(artisanId: number, etablissementId: number): Promise<boolean> {
    const artisan = await this.artisanRepo.findOne({ where: { id: artisanId }, relations: ['embauchedEtablissements'] });
    if (!artisan) return false;
    return !!artisan.embauchedEtablissements?.some(e => e.id === etablissementId);
  }

  async getEtablissementsWithOffres() {
    const etablissements = await this.etabRepo.find({ relations: ['etoffres'] });
    return etablissements.map(etab => ({
      id: etab.id,
      name: etab.nameOfEtablissement,
      type: etab.type,
      offres: etab.etoffres?.map(offre => ({
        id: offre.id,
        titre: offre.titre,
        description: offre.description,
        typeContrat: offre.typeContrat,
        skills: offre.skills,
        budget: offre.budget
      })) || []
    }));
  }

  // --- Get artisans by type ---
  async getArtisansByType(type: string) {
    const artisans = await this.artisanRepo.find({ where: { artisanType: type } });
    return artisans;
  }

  // --- Get all embauche requests for an etablissement (all statuses) ---
  async getAllEmbaucheRequestsForEtablissement(etablissementId: number) {
    return this.embaucheRequestRepo.find({
      where: { etablissement: { id: etablissementId } },
      relations: ['user', 'artisan'],
      order: { createdAt: 'DESC' },
    });
  }

  // --- Artisans with offres ---
  async getArtisansWithOffres() {
    const artisans = await this.artisanRepo.find({ relations: ['artoffres'] });
    return artisans.map(artisan => ({
      id: artisan.id,
      firstName: artisan.firstName,
      lastName: artisan.lastName,
      type: artisan.artisanType,
      disponibilite: artisan.disponibilite,
      offres: artisan.artoffres?.map(offre => ({
        id: offre.id,
        titre: offre.title,
        description: offre.description,
        prix: offre.prix,
        imageProofOfWork: offre.imageProofOfWork,
      })) || []
    }));
  }

  // --- Etablissements with offres filtered by subscription status ---
  async getEtablissementsWithOffresFiltered() {
    const etablissements = await this.etabRepo.find({ relations: ['etoffres'] });
    const filteredEtablissements: any[] = [];

    for (const etab of etablissements) {
      const subscriptionStatus = await this.subscriptionChecker.checkEtablissementSubscription(etab.email);
      if (subscriptionStatus?.canAccessDashboard) {
        filteredEtablissements.push({
          id: etab.id,
          name: etab.nameOfEtablissement,
          type: etab.type,
          paymentStatus: etab.paymentStatus,
          subscriptionPlan: etab.subscriptionPlan,
          subscriptionStatus: etab.subscriptionStatus,
          offres: etab.etoffres?.map(offre => ({
            id: offre.id,
            titre: offre.titre,
            description: offre.description,
            typeContrat: offre.typeContrat,
            skills: offre.skills,
            budget: offre.budget
          })) || []
        });
      }
    }

    return filteredEtablissements;
  }

  // --- Artisans with offres filtered by subscription status ---
  async getArtisansWithOffresFiltered() {
    const artisans = await this.artisanRepo.find({ relations: ['artoffres'] });
    const filteredArtisans: any[] = [];

    for (const artisan of artisans) {
      const subscriptionStatus = await this.subscriptionChecker.checkArtisanSubscription(artisan.email);
      if (subscriptionStatus?.canAccessDashboard) {
        filteredArtisans.push({
          id: artisan.id,
          firstName: artisan.firstName,
          lastName: artisan.lastName,
          type: artisan.artisanType,
          disponibilite: artisan.disponibilite,
          paymentStatus: artisan.paymentStatus,
          subscriptionPlan: artisan.subscriptionPlan,
          subscriptionStatus: artisan.subscriptionStatus,
          offres: artisan.artoffres?.map(offre => ({
            id: offre.id,
            titre: offre.title,
            description: offre.description,
            prix: offre.prix,
            imageProofOfWork: offre.imageProofOfWork,
          })) || []
        });
      }
    }

    return filteredArtisans;
  }

  // --- Artisans with all info and artoffres (for /auth/artisans-by-type-offer) ---
  async getArtisansWithOffersFull() {
    const artisans = await this.artisanRepo.find({ relations: ['artoffres'] });
    return artisans.map(artisan => ({
      id: artisan.id,
      lastName: artisan.lastName,
      firstName: artisan.firstName,
      email: artisan.email,
      phone: artisan.phone,
      dateOfBirth: artisan.dateOfBirth,
      artisanType: artisan.artisanType,
      artisanExperience: artisan.artisanExperience,
      artisanCertification: artisan.artisanCertification,
      subscriptionPlan: artisan.subscriptionPlan,
      subscriptionStatus: artisan.subscriptionStatus,
      paymentStatus: artisan.paymentStatus,
      subscriptionStartDate: artisan.subscriptionStartDate,
      subscriptionEndDate: artisan.subscriptionEndDate,
      disponibilite: artisan.disponibilite,
      image: artisan.image,
      artoffres: artisan.artoffres?.map(offre => ({
        id: offre.id,
        title: offre.title,
        description: offre.description,
        prix: offre.prix,
        imageProofOfWork: offre.imageProofOfWork,
      })) || []
    }));
  }

  // --- Artisans with avis by type ---
  async getArtisansWithAvisByType(type?: string) {
    const where = type ? { artisanType: type } : {};
    const artisans = await this.artisanRepo.find({ where, relations: ['artavis'] });
    return artisans.map(artisan => ({
      id: artisan.id,
      Image: artisan.image,
      firstName: artisan.firstName,
      lastName: artisan.lastName,
      type: artisan.artisanType,
      phone: artisan.phone,
      disponibilite: artisan.disponibilite,
      avis: artisan.artavis?.map(avis => ({
        id: avis.id,
        rate: avis.rate,
        comment: avis.comment,
      })) || []
    }));
  }

  // --- Registration ---
  async register(data: (BaseRegisterDto | EtablissementRegisterDto) & { role: Role; extra?: any }) {
    console.log('AuthService.register received data:', data);
    console.log('AuthService.register received data.extra:', data.extra);
    try {
      if (data.password !== data.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      const bcrypt = await import('bcryptjs');
      const hashed = await bcrypt.hash(data.password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      if (data.role === Role.ARTISANA) {
        const artisanData = data as any;
        // Prevent duplicate email across all account types
        const existingEmailArtisan = await this.userRepo.findOne({ where: { email: artisanData.email } }) ||
                                   await this.artisanRepo.findOne({ where: { email: artisanData.email } }) ||
                                   await this.etabRepo.findOne({ where: { email: artisanData.email } });
        if (existingEmailArtisan) {
          throw new BadRequestException('Email already exists');
        }
        const now = new Date();
        const endDate = new Date(now.getTime());
        endDate.setDate(endDate.getDate() + 30);

        const artisan = this.artisanRepo.create({
          image: artisanData.image,
          lastName: artisanData.lastName,
          firstName: artisanData.firstName,
          email: artisanData.email,
          phone: artisanData.phone,
          dateOfBirth: artisanData.dateOfBirth ? new Date(artisanData.dateOfBirth) : undefined,
          password: hashed,
          confirmPassword: hashed,
          artisanType: artisanData.artisanType,
          artisanExperience: artisanData.artisanExperience ?? undefined,
          artisanCertification: artisanData.artisanCertification ?? undefined,
          disponibilite: artisanData.disponibilite ?? 'Disponible',
          // Set initial subscription window at registration
          subscriptionStartDate: now,
          subscriptionEndDate: endDate,
          subscriptionStatus: 'ACTIVE',
          paymentStatus: 'non_payed',
        });
        const savedArtisan = await this.artisanRepo.save(artisan);
        await this.mailService.sendVerificationCode(savedArtisan.email, verificationCode);
        return savedArtisan;
      }

      if (data.role === Role.ETABLISSEMENT) {
        const etabData = data as EtablissementRegisterDto;
        if (!etabData.nameOfEtablissement) {
          throw new Error('nameOfEtablissement is required');
        }
        const etabType = etabData.type ?? 'Startup';
        const now = new Date();
        const endDate = new Date(now.getTime());
        endDate.setDate(endDate.getDate() + 30);

        // Prevent duplicate email across all account types
        const existingEmailEtab = await this.userRepo.findOne({ where: { email: etabData.email } }) ||
                                 await this.artisanRepo.findOne({ where: { email: etabData.email } }) ||
                                 await this.etabRepo.findOne({ where: { email: etabData.email } });
        if (existingEmailEtab) {
          throw new BadRequestException('Email already exists');
        }

        const etab = this.etabRepo.create({
          image: etabData.image,
          nameOfEtablissement: etabData.nameOfEtablissement,
          imageOfStatusProof: etabData.imageOfStatusProof,
          email: etabData.email,
          since: etabData.since ?? undefined,
          phone: etabData.phone ?? undefined,
          employeesCount: etabData.employeesCount ?? undefined,
          localisation: etabData.localisation ?? undefined,
          secteur: etabData.secteur ?? undefined,
          password: hashed,
          confirmPassword: hashed,
          type: etabType,
          subscriptionStartDate: now,
          subscriptionEndDate: endDate,
          subscriptionStatus: 'ACTIVE',
          paymentStatus: 'non_payed',
        });
        const savedEtab = await this.etabRepo.save(etab);
        await this.mailService.sendVerificationCode(savedEtab.email, verificationCode);
        return savedEtab;
      }

      const userData = data as any;
      const now = new Date();
      const endDate = new Date(now.getTime());
      endDate.setDate(endDate.getDate() + 30);

      // Prevent duplicate email across all account types
      const existingEmailUser = await this.userRepo.findOne({ where: { email: userData.email } }) ||
                               await this.artisanRepo.findOne({ where: { email: userData.email } }) ||
                               await this.etabRepo.findOne({ where: { email: userData.email } });
      if (existingEmailUser) {
        throw new BadRequestException('Email already exists');
      }

      const user = this.userRepo.create({
        image: userData.image,
        lastName: userData.lastName,
        firstName: userData.firstName,
        email: userData.email,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
        password: hashed,
        confirmPassword: hashed
      ,
        subscriptionStartDate: now,
        subscriptionEndDate: endDate,
        subscriptionStatus: 'ACTIVE',
        paymentStatus: 'non_payed',
      });
      const savedUser = await this.userRepo.save(user);
      await this.mailService.sendVerificationCode(savedUser.email, verificationCode);
      return savedUser;
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw new BadRequestException(error?.message || 'Registration failed');
    }
  }

  // --- List all artisans ---
  async getAllArtisans() {
    return this.artisanRepo.find();
  }

  // --- Get artisans by specialty ---
  async getArtisansBySpecialty(specialty: string) {
    return this.artisanRepo.find({
      where: { artisanType: specialty },
      relations: ['user']
    });
  }

  // --- Get artisan by ID ---
  async getArtisanById(id: number) {
    return this.artisanRepo.findOne({
      where: { id },
      relations: ['user']
    });
  }

  // --- List all etablissements ---
  async getAllEtablissements() {
    return this.etabRepo.find();
  }

  // --- List all users ---
  async getAllUsers() {
    return this.userRepo.find();
  }
  async updateEmbaucheRequestStatus(requestId: number, status: 'pending' | 'accepted' | 'refused') {
    const req = await this.embaucheRequestRepo.findOne({ where: { id: requestId } });
    if (!req) {
      return { message: 'EmbaucheRequest not found' };
    }
    req.status = status;
    req.updatedAt = new Date();
    await this.embaucheRequestRepo.save(req);
    return { message: 'EmbaucheRequest updated', requestId: req.id, status: req.status, updatedAt: req.updatedAt };
  }
  // --- Login ---
  async login(loginDto: LoginDto) {
    try {
      const { email, password, confirmPassword } = loginDto;
      if (password !== confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      let user: User | Artisan | Etablissement | null = null;
      let userType: 'user' | 'artisan' | 'etablissement' = 'user';

      user = await this.userRepo.findOne({ where: { email } });
      if (user) userType = 'user';
      else {
        user = await this.artisanRepo.findOne({ where: { email } });
        if (user) userType = 'artisan';
        else {
          user = await this.etabRepo.findOne({ where: { email } });
          if (user) userType = 'etablissement';
        }
      }

      if (!user) throw new UnauthorizedException('Invalid email or password');

      const bcrypt = await import('bcryptjs');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new UnauthorizedException('Invalid email or password');

      const { password: _, confirmPassword: __, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, userType, message: 'Login successful' };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw new BadRequestException('Login failed');
    }
  }

  // --- Get User Name ---
  async getUserName(idOrEmail: { id?: number; email?: string }) {
    let user: User | null = null;

    if (idOrEmail.id) {
      user = await this.userRepo.findOne({ where: { id: idOrEmail.id } });
    } else if (idOrEmail.email) {
      user = await this.userRepo.findOne({ where: { email: idOrEmail.email } });
    }

    if (!user) throw new BadRequestException('User not found');

    return user;
  }

  // --- Get Artisan Name ---
  async getArtisanName(idOrEmail: { id?: number; email?: string }) {
    let artisan: Artisan | null = null;
    if (idOrEmail.id) {
      artisan = await this.artisanRepo.findOne({ where: { id: idOrEmail.id } });
    } else if (idOrEmail.email) {
      artisan = await this.artisanRepo.findOne({ where: { email: idOrEmail.email } });
    }
    if (!artisan) throw new BadRequestException('Artisan not found');
    return artisan;
  }

// In getEtablissementName method in auth.service.ts
async getEtablissementName(idOrEmail: { id?: number; email?: string }): Promise<Etablissement> {
  let etab: Etablissement | null = null;

  if (idOrEmail.id) {
    etab = await this.etabRepo.findOne({
      where: { id: idOrEmail.id },
      relations: ['etoffres'],
    });
  } else if (idOrEmail.email) {
    etab = await this.etabRepo.findOne({
      where: { email: idOrEmail.email },
      relations: ['etoffres'],
    });
  }

  if (!etab) {
    throw new BadRequestException("Établissement introuvable avec l'identifiant fourni.");
  }

  console.log('=== GET ETABLISSEMENT DEBUG ===');
  console.log('🏢 Etablissement ID:', etab.id);
  console.log('📋 Number of offers:', etab.etoffres?.length);
  
  return etab;
}

  async updatePassword(data: { email: string; currentPassword: string; newPassword: string; confirmPassword: string }) {
    try {
      if (data.newPassword !== data.confirmPassword) {
        throw new BadRequestException('New passwords do not match');
      }

      let user: any = null;
      let repository: any = null;

      user = await this.userRepo.findOne({ where: { email: data.email } });
      if (user) repository = this.userRepo;
      else {
        user = await this.artisanRepo.findOne({ where: { email: data.email } });
        if (user) repository = this.artisanRepo;
        else {
          user = await this.etabRepo.findOne({ where: { email: data.email } });
          if (user) repository = this.etabRepo;
        }
      }

      if (!user) throw new UnauthorizedException('User not found');

      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
      if (!isValidPassword) throw new UnauthorizedException('Current password is incorrect');

      const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
      await repository.update(user.id, { password: hashedNewPassword, confirmPassword: hashedNewPassword });

      return { message: 'Password updated successfully' };
    } catch (error) {
      console.error('❌ Update password error:', error);
      throw new BadRequestException('Failed to update password');
    }
  }
// In auth.service.ts - add this method
// In auth.service.ts - add these methods

// Debug method to get all embauche requests
async debugEmbaucheRequests(etablissementId: number) {
  const requests = await this.embaucheRequestRepo.find({
    where: { etablissement: { id: etablissementId } },
    relations: ['user', 'artisan', 'etablissement'],
  });
  
  return requests.map(req => ({
    id: req.id,
    offerId: req.offerId,
    status: req.status,
    userId: req.user?.id,
    artisanId: req.artisan?.id,
    etablissementId: req.etablissement?.id,
    createdAt: req.createdAt
  }));
}

// Debug method to update offerId
async debugUpdateOfferId(requestId: number, offerId: number) {
  const request = await this.embaucheRequestRepo.findOne({ where: { id: requestId } });
  if (!request) throw new BadRequestException('Request not found');
  
  console.log('🔄 Updating request:', { 
    from: request.offerId, 
    to: offerId 
  });
  
  request.offerId = offerId;
  const updated = await this.embaucheRequestRepo.save(request);
  
  console.log('✅ Updated request:', {
    id: updated.id,
    offerId: updated.offerId,
    status: updated.status
  });
  
  return { 
    message: 'OfferId updated', 
    requestId: updated.id, 
    offerId: updated.offerId 
  };
}

  async updateEmail(data: { currentEmail: string; newEmail: string; password: string }) {
    try {
      let user: any = null;
      let repository: any = null;

      user = await this.userRepo.findOne({ where: { email: data.currentEmail } });
      if (user) repository = this.userRepo;
      else {
        user = await this.artisanRepo.findOne({ where: { email: data.currentEmail } });
        if (user) repository = this.artisanRepo;
        else {
          user = await this.etabRepo.findOne({ where: { email: data.currentEmail } });
          if (user) repository = this.etabRepo;
        }
      }

      if (!user) throw new UnauthorizedException('User not found');

      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) throw new UnauthorizedException('Password is incorrect');

      const existingUser = await this.userRepo.findOne({ where: { email: data.newEmail } }) ||
                           await this.artisanRepo.findOne({ where: { email: data.newEmail } }) ||
                           await this.etabRepo.findOne({ where: { email: data.newEmail } });

      if (existingUser) throw new BadRequestException('Email already exists');

      await repository.update(user.id, { email: data.newEmail });
      return { message: 'Email updated successfully' };
    } catch (error) {
      console.error('❌ Update email error:', error);
      throw new BadRequestException('Failed to update email');
    }
  }

  async updateSubscription(data: { email: string; subscriptionPlan: string }) {
    try {
      if (!['standard', 'premium'].includes(data.subscriptionPlan)) {
        throw new BadRequestException('Invalid subscription plan');
      }

      let user: User | Artisan | null = null;
      let repository: Repository<User> | Repository<Artisan> | null = null;

      user = await this.userRepo.findOne({ where: { email: data.email } });
      if (user) repository = this.userRepo;
      else {
        user = await this.artisanRepo.findOne({ where: { email: data.email } });
        if (user) repository = this.artisanRepo;
        else throw new BadRequestException('Subscriptions not available for establishments');
      }

      if (!user || !repository) throw new UnauthorizedException('User not found');

      const now = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await repository.update(user.id, {
        subscriptionPlan: data.subscriptionPlan,
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: now,
        subscriptionEndDate: endDate
      });

      return { message: 'Subscription updated successfully', subscriptionPlan: data.subscriptionPlan, subscriptionStatus: 'ACTIVE' };
    } catch (error) {
      console.error('❌ Update subscription error:', error);
      throw new BadRequestException('Failed to update subscription');
    }
  }

  async updateUserPaymentStatus(email: string, paymentStatus: 'payed' | 'non_payed') {
    return this.updatePaymentStatusByEmail({
      email,
      paymentStatus,
      repository: this.userRepo,
      entityLabel: 'User',
    });
  }

  async updateArtisanPaymentStatus(email: string, paymentStatus: 'payed' | 'non_payed') {
    return this.updatePaymentStatusByEmail({
      email,
      paymentStatus,
      repository: this.artisanRepo,
      entityLabel: 'Artisan',
    });
  }

  async updateEtablissementPaymentStatus(email: string, paymentStatus: 'payed' | 'non_payed') {
    return this.updatePaymentStatusByEmail({
      email,
      paymentStatus,
      repository: this.etabRepo,
      entityLabel: 'Etablissement',
    });
  }

  private async updatePaymentStatusByEmail<T extends { id: number }>(options: {
    email: string;
    paymentStatus: 'payed' | 'non_payed';
    repository: Repository<T>;
    entityLabel: string;
  }) {
    const { email, paymentStatus, repository, entityLabel } = options;

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    if (!this.allowedPaymentStatuses.includes(paymentStatus)) {
      throw new BadRequestException('Invalid payment status');
    }

    const entity = await repository.findOne({ where: { email } as any });
    if (!entity) {
      throw new BadRequestException(`${entityLabel} not found`);
    }

    const updatePayload: any = { paymentStatus };

    if (paymentStatus === 'payed') {
      const now = new Date();
      const endDate = new Date(now.getTime());
      endDate.setDate(endDate.getDate() + 30);
      updatePayload.subscriptionStartDate = now;
      updatePayload.subscriptionEndDate = endDate;
      updatePayload.subscriptionStatus = 'ACTIVE';
    }

    await repository.update(entity.id, updatePayload as any);

    return { message: `${entityLabel} payment status updated successfully`, paymentStatus, updated: updatePayload };
  }

  // --- Update user profile image ---
  async updateUserImage(id: number, filename: string): Promise<any> {
    try {
      console.log('Updating user image:', { id, filename });
      
      const user = await this.userRepo.findOne({ where: { id } });
      if (user) {
        await this.userRepo.update(user.id, { image: filename });
        console.log('User image updated successfully:', { userId: user.id, filename });
        return { 
          message: 'Image updated successfully',
          userId: user.id,
          filename 
        };
      }

      console.log('User not found for id:', id);
      return null;
    } catch (error) {
      console.error('Error updating user image:', error);
      throw new BadRequestException('Failed to update user image');
    }
  }

  // --- Update etablissement profile image ---
  async updateEtablissementImage(id: number, filename: string): Promise<any> {
    try {
      console.log('Updating etablissement image:', { id, filename });
      
      const etablissement = await this.etabRepo.findOne({ where: { id } });
      if (etablissement) {
        await this.etabRepo.update(etablissement.id, { image: filename });
        console.log('Etablissement image updated successfully:', { etablissementId: etablissement.id, filename });
        return { 
          message: 'Image updated successfully',
          etablissementId: etablissement.id,
          filename 
        };
      }

      console.log('Etablissement not found for id:', id);
      return null;
    } catch (error) {
      console.error('Error updating etablissement image:', error);
      throw new BadRequestException('Failed to update etablissement image');
    }
  }

  // --- Update artisana profile image ---
  async updateArtisanaImage(id: number, filename: string): Promise<any> {
    try {
      console.log('Updating artisana image:', { id, filename });
      
      const artisan = await this.artisanRepo.findOne({ where: { id } });
      if (artisan) {
        await this.artisanRepo.update(artisan.id, { image: filename });
        console.log('Artisan image updated successfully:', { artisanId: artisan.id, filename });
        return { 
          message: 'Image updated successfully',
          artisanId: artisan.id,
          filename 
        };
      }

      console.log('Artisana not found for id:', id);
      return null;
    } catch (error) {
      console.error('Error updating artisana image:', error);
      throw new BadRequestException('Failed to update artisana image');
    }
  }

  // --- Create embauche relation: User <-> Etablissement ---
  async requestEmbaucheUser(userId: number, etablissementId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['embauchedEtablissements'] });
    const etab = await this.etabRepo.findOne({ where: { id: etablissementId }, relations: ['embauchedUsers'] });
    if (!user || !etab) throw new BadRequestException('User or Etablissement not found');
    if (user.embauchedEtablissements?.some(e => e.id === etablissementId)) {
      return { message: 'Relation already exists' };
    }
    user.embauchedEtablissements = [...(user.embauchedEtablissements || []), etab];
    await this.userRepo.save(user);
    return { message: 'Embauche relation created', userId, etablissementId };
  }

  // --- Create embauche relation: Artisan <-> Etablissement ---
  async requestEmbaucheArtisan(artisanId: number, etablissementId: number) {
    const artisan = await this.artisanRepo.findOne({ where: { id: artisanId }, relations: ['embauchedEtablissements'] });
    const etab = await this.etabRepo.findOne({ where: { id: etablissementId }, relations: ['embauchedArtisans'] });
    if (!artisan || !etab) throw new BadRequestException('Artisan or Etablissement not found');
    if (artisan.embauchedEtablissements?.some(e => e.id === etablissementId)) {
      return { message: 'Relation already exists' };
    }
    artisan.embauchedEtablissements = [...(artisan.embauchedEtablissements || []), etab];
    await this.artisanRepo.save(artisan);
    return { message: 'Embauche relation created', artisanId, etablissementId };
  }

// In createUserEmbaucheRequest method - add these logs
// In auth.service.ts - update createUserEmbaucheRequest method
async createUserEmbaucheRequest(userId: number, etablissementId: number, profileFields?: { cv?: string; github?: string; portfolio?: string; linkdin?: string }, offerId?: number) {
  console.log('=== CREATE USER EMBauche REQUEST DEBUG ===');
  console.log('📝 Parameters:', { userId, etablissementId, offerId, profileFields });
  
  const user = await this.userRepo.findOne({ where: { id: userId } });
  const etab = await this.etabRepo.findOne({ where: { id: etablissementId } });
  
  console.log('👤 User found:', user?.id);
  console.log('🏢 Etablissement found:', etab?.id);
  
  if (!user || !etab) {
    console.log('❌ User or Etablissement not found');
    throw new BadRequestException('User or Etablissement not found');
  }

  // Update user profile fields if provided
  if (profileFields) {
    console.log('📄 Updating profile fields:', profileFields);
    if (profileFields.cv !== undefined) user.cv = profileFields.cv;
    if (profileFields.github !== undefined) user.github = profileFields.github;
    if (profileFields.portfolio !== undefined) user.portfolio = profileFields.portfolio;
    if (profileFields.linkdin !== undefined) user.linkdin = profileFields.linkdin;
    await this.userRepo.save(user);
    console.log('✅ User profile updated');
  }

  const where: any = { user: { id: userId }, etablissement: { id: etablissementId }, status: 'pending' };
  if (offerId) {
    where.offerId = offerId;
    console.log('🎯 Checking for existing request with offerId:', offerId);
  } else {
    console.log('⚠️ No offerId provided, checking without offerId filter');
  }
  
  const existing = await this.embaucheRequestRepo.findOne({ where });
  
  if (existing) {
    console.log('🔍 Existing request found:', {
      id: existing.id,
      offerId: existing.offerId,
      status: existing.status
    });
    return { message: 'Pending request already exists', user };
  }
  
  console.log('🆕 Creating new embauche request...');
  const req = this.embaucheRequestRepo.create({ 
    user, 
    etablissement: etab, 
    status: 'pending', 
    offerId 
  });
  
  const savedReq = await this.embaucheRequestRepo.save(req);
  console.log('✅ Embauche request created:', {
    id: savedReq.id,
    offerId: savedReq.offerId,
    status: savedReq.status,
    userId: savedReq.user?.id,
    etablissementId: savedReq.etablissement?.id
  });
  
  return { message: 'Embauche request created', requestId: req.id, user };
}

  // --- Create embauche request for Artisan ---
  async createArtisanEmbaucheRequest(artisanId: number, etablissementId: number) {
    const artisan = await this.artisanRepo.findOne({ where: { id: artisanId } });
    const etab = await this.etabRepo.findOne({ where: { id: etablissementId } });
    if (!artisan || !etab) throw new BadRequestException('Artisan or Etablissement not found');
    const existing = await this.embaucheRequestRepo.findOne({ where: { artisan: { id: artisanId }, etablissement: { id: etablissementId }, status: 'pending' } });
    if (existing) return { message: 'Pending request already exists' };
    const req = this.embaucheRequestRepo.create({ artisan, etablissement: etab, status: 'pending' });
    await this.embaucheRequestRepo.save(req);
    return { message: 'Embauche request created', requestId: req.id };
  }

  // --- Get embauche requests for an Etablissement ---
  async getEmbaucheRequestsForEtablissement(etablissementId: number) {
    return this.embaucheRequestRepo.find({
      where: { etablissement: { id: etablissementId }, status: 'pending' },
      relations: ['user', 'artisan'],
      order: { createdAt: 'DESC' },
    });
  }

  // --- Accept embauche request ---
  async acceptEmbaucheRequest(requestId: number) {
    try {
      const req = await this.embaucheRequestRepo.findOne({ where: { id: requestId }, relations: ['user', 'artisan', 'etablissement'] });
      if (!req) {
        console.error('EmbaucheRequest not found for id:', requestId);
        throw new BadRequestException('Request not found');
      }
      req.status = 'accepted';
      await this.embaucheRequestRepo.save(req);
      
      if (req.user) {
        req.user.embauchedEtablissements = [...(req.user.embauchedEtablissements || []), req.etablissement];
        await this.userRepo.save(req.user);
        
        // Automatically share all work orders from this establishment with the user
        try {
          await this.orderService.shareEstablishmentOrdersWithUser(req.etablissement.id, req.user.id);
          console.log(`✅ Shared work orders from establishment ${req.etablissement.id} with user ${req.user.id}`);
        } catch (orderError) {
          console.error('Error sharing work orders:', orderError);
          // Don't fail the embauche acceptance if order sharing fails
        }
      }
      
      if (req.artisan) {
        req.artisan.embauchedEtablissements = [...(req.artisan.embauchedEtablissements || []), req.etablissement];
        await this.artisanRepo.save(req.artisan);
        
        // Automatically share all work orders from this establishment with the artisan
        try {
          await this.orderService.shareEstablishmentOrdersWithUser(req.etablissement.id, req.artisan.id);
          console.log(`✅ Shared work orders from establishment ${req.etablissement.id} with artisan ${req.artisan.id}`);
        } catch (orderError) {
          console.error('Error sharing work orders:', orderError);
          // Don't fail the embauche acceptance if order sharing fails
        }
      }
      
      return { message: 'Embauche request accepted', status: 'accepted' };
    } catch (err) {
      console.error('Error in acceptEmbaucheRequest:', err);
      throw err;
    }
  }

  // --- Refuse embauche request ---
  async refuseEmbaucheRequest(requestId: number) {
    const req = await this.embaucheRequestRepo.findOne({ where: { id: requestId } });
    if (!req) throw new BadRequestException('Request not found');
    req.status = 'refused';
    await this.embaucheRequestRepo.save(req);
    return { message: 'Embauche request refused', status: 'refused' };
  }
}