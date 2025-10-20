import { 
  Body, 
  Controller, 
  Get, 
  Post, 
  Put, 
  Query, 
  UploadedFiles, 
  UploadedFile,
  UseInterceptors,
  Param,
  ParseIntPipe,
  BadRequestException 
} from '@nestjs/common';
import { FilesInterceptor, FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { AuthService } from './auth.service';
import { SubscriptionCheckerService } from './subscription-checker.service';
import { BaseRegisterDto, EtablissementRegisterDto, ArtisanaRegisterDto, LoginDto, UpdatePasswordDto, UpdateEmailDto } from './dto';
import { Role } from './roles.enum';
import { EmbaucheRequestActionDto } from './dto/embauche-request-action.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly subscriptionChecker: SubscriptionCheckerService
  ) {}

  // --- Password Reset Endpoints ---
  @Post('reset-password/request')
  async requestResetPassword(@Body() body: { email: string }) {
    return this.authService.requestResetPasswordCode(body.email);
  }

  @Post('reset-password/verify')
  async verifyResetCode(@Body() body: { email: string; code: string }) {
    return this.authService.verifyResetPasswordCode(body.email, body.code);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; code: string; newPassword: string; confirmPassword: string }) {
    return this.authService.resetPasswordWithCode(body.email, body.code, body.newPassword, body.confirmPassword);
  }

  // --- Subscription Status Endpoints ---
  @Get('subscription-status/user/:email')
  async getUserSubscriptionStatus(@Param('email') email: string) {
    const status = await this.subscriptionChecker.checkUserSubscription(email);
    if (!status) {
      return { error: 'User not found' };
    }
    return status;
  }

  @Get('subscription-status/artisan/:email')
  async getArtisanSubscriptionStatus(@Param('email') email: string) {
    const status = await this.subscriptionChecker.checkArtisanSubscription(email);
    if (!status) {
      return { error: 'Artisan not found' };
    }
    return status;
  }

  @Get('subscription-status/etablissement/:email')
  async getEtablissementSubscriptionStatus(@Param('email') email: string) {
    const status = await this.subscriptionChecker.checkEtablissementSubscription(email);
    if (!status) {
      return { error: 'Etablissement not found' };
    }
    return status;
  }

  @Post('extend-subscription')
  async extendSubscription(@Body() body: { 
    entityType: 'user' | 'artisan' | 'etablissement';
    email: string;
  }) {
    await this.subscriptionChecker.extendSubscription(body.entityType, body.email);
    return { success: true, message: 'Subscription extended successfully' };
  }

  @Post('update-expired-subscriptions')
  async updateExpiredSubscriptions() {
    await this.subscriptionChecker.updateExpiredSubscriptions();
    return { success: true, message: 'Expired subscriptions updated' };
  }

  @Put('payment-status/user/:emailParam')
  async updateUserPaymentStatus(
    @Param('emailParam') emailParam: string,
    @Body() body: { paymentStatus?: 'payed' | 'non_payed' }
  ) {
    const paymentStatus = this.normalizePaymentStatus(body.paymentStatus);
    const email = this.normalizeEmailParam(emailParam);
    return this.authService.updateUserPaymentStatus(email, paymentStatus);
  }

  @Put('payment-status/artisan/:emailParam')
  async updateArtisanPaymentStatus(
    @Param('emailParam') emailParam: string,
    @Body() body: { paymentStatus?: 'payed' | 'non_payed' }
  ) {
    const paymentStatus = this.normalizePaymentStatus(body.paymentStatus);
    const email = this.normalizeEmailParam(emailParam);
    return this.authService.updateArtisanPaymentStatus(email, paymentStatus);
  }

  @Put('payment-status/etablissement/:emailParam')
  async updateEtablissementPaymentStatus(
    @Param('emailParam') emailParam: string,
    @Body() body: { paymentStatus?: 'payed' | 'non_payed' }
  ) {
    const paymentStatus = this.normalizePaymentStatus(body.paymentStatus);
    const email = this.normalizeEmailParam(emailParam);
    return this.authService.updateEtablissementPaymentStatus(email, paymentStatus);
  }

  private normalizeEmailParam(emailParam: string) {
    if (!emailParam) {
      throw new BadRequestException('Email parameter is required');
    }

    const prefix = 'email=';
    const normalized = emailParam.startsWith(prefix)
      ? emailParam.slice(prefix.length)
      : emailParam;

    if (!normalized) {
      throw new BadRequestException('Email is required');
    }

    return normalized;
  }

  private normalizePaymentStatus(status?: string): 'payed' | 'non_payed' {
    if (!status) {
      throw new BadRequestException('paymentStatus is required');
    }

    const normalized = status.trim().toLowerCase();

    if (normalized === 'payed' || normalized === 'paid' || normalized === 'payer') {
      return 'payed';
    }

    if (
      normalized === 'non_payed' ||
      normalized === 'non-payed' ||
      normalized === 'unpaid' ||
      normalized === 'non_payer' ||
      normalized === 'nonpayer'
    ) {
      return 'non_payed';
    }

    throw new BadRequestException('Invalid payment status');
  }

  // --- Artisans by type with offers ---
  @Get('artisans-by-type-offer')
  async getArtisansByTypeOffer(@Query('requesterEmail') requesterEmail?: string) {
    // Check if requester has valid subscription to access dashboard
    if (requesterEmail) {
      const userStatus = await this.subscriptionChecker.checkUserSubscription(requesterEmail);
      const artisanStatus = await this.subscriptionChecker.checkArtisanSubscription(requesterEmail);
      const etablissementStatus = await this.subscriptionChecker.checkEtablissementSubscription(requesterEmail);
      
      const hasAccess = userStatus?.canAccessDashboard || 
                       artisanStatus?.canAccessDashboard || 
                       etablissementStatus?.canAccessDashboard;
      
      if (!hasAccess) {
        return { 
          error: 'Access denied', 
          message: 'Your subscription has expired or payment is required to access dashboard',
          subscriptionRequired: true 
        };
      }
    }

    const artisans = await this.authService.getArtisansWithOffersFull();
    
    // Filter artisans based on their subscription status - only show those with active subscriptions
    const activeArtisans: any[] = [];
    for (const artisan of artisans) {
      const artisanStatus = await this.subscriptionChecker.checkArtisanSubscription(artisan.email);
      if (artisanStatus?.canAccessDashboard) {
        activeArtisans.push(artisan);
      }
    }
    
    const grouped: Record<string, any[]> = {};
    for (const artisan of activeArtisans) {
      const artType = artisan.artisanType || 'Autre';
      if (!grouped[artType]) grouped[artType] = [];
      grouped[artType].push(artisan);
    }
    return grouped;
  }

  // --- Get artisans by specialty ---
  @Get('artisans-by-specialty')
  async getArtisansBySpecialty(@Query('specialty') specialty: string) {
    console.log('GET /auth/artisans-by-specialty called with specialty:', specialty);
    if (!specialty) {
      return [];
    }
    
    const artisans = await this.authService.getArtisansBySpecialty(specialty);
    return artisans.map(artisan => ({
      id: artisan.id,
      firstName: artisan.firstName,
      lastName: artisan.lastName,
      phone: artisan.phone,
      email: artisan.email,
      specialty: artisan.artisanType,
      image: artisan.image,
      isAvailable: artisan.disponibilite && artisan.disponibilite.length > 0,
      experience: artisan.artisanExperience,
      certification: artisan.artisanCertification,
      subscriptionPlan: artisan.subscriptionPlan,
      paymentStatus: artisan.paymentStatus
    }));
  }

  // --- Get individual artisan profile ---
  @Get('artisan/:id')
  async getArtisanProfile(@Param('id', ParseIntPipe) id: number) {
    console.log('GET /auth/artisan/:id called with id:', id);
    
    const artisan = await this.authService.getArtisanById(id);
    if (!artisan) {
      throw new Error('Artisan not found');
    }

    return {
      id: artisan.id,
      firstName: artisan.firstName,
      lastName: artisan.lastName,
      phone: artisan.phone,
      email: artisan.email,
      artisanType: artisan.artisanType,
      image: artisan.image,
      disponibilite: artisan.disponibilite,
      artisanExperience: artisan.artisanExperience,
      artisanCertification: artisan.artisanCertification,
      subscriptionPlan: artisan.subscriptionPlan,
      subscriptionStatus: artisan.subscriptionStatus,
      paymentStatus: artisan.paymentStatus
    };
  }

  // --- Get all embauche requests for an etablissement ---
  @Get('etablissement/requests')
  async getEtablissementEmbaucheRequests(@Query('etablissementId') etablissementId: string) {
    const requests = await this.authService.getAllEmbaucheRequestsForEtablissement(Number(etablissementId));
    return requests.map(req => ({
      id: req.id,
      status: req.status,
      user: req.user ? { 
        id: req.user.id, 
        firstName: req.user.firstName, 
        lastName: req.user.lastName,
        image: req.user.image,
        cv: req.user.cv,
        github: req.user.github,
        portfolio: req.user.portfolio,
        linkdin: req.user.linkdin
      } : null,
      artisan: req.artisan ? { 
        id: req.artisan.id, 
        firstName: req.artisan.firstName, 
        lastName: req.artisan.lastName, 
        image: req.artisan.image,
        imageProofOfWork: req.artisan.imageProofOfWork,
        artisanType: req.artisan.artisanType 
      } : null
    }));
  }


  // --- Get artisans by type ---
  @Get('artisans-by-type')
  async getArtisansByType(@Query('type') type?: string, @Query('requesterEmail') requesterEmail?: string) {
    console.log('GET /auth/artisans-by-type called with type:', type);
    
    // Check if requester has valid subscription to access dashboard
    if (requesterEmail) {
      const userStatus = await this.subscriptionChecker.checkUserSubscription(requesterEmail);
      const artisanStatus = await this.subscriptionChecker.checkArtisanSubscription(requesterEmail);
      const etablissementStatus = await this.subscriptionChecker.checkEtablissementSubscription(requesterEmail);
      
      const hasAccess = userStatus?.canAccessDashboard || 
                       artisanStatus?.canAccessDashboard || 
                       etablissementStatus?.canAccessDashboard;
      
      if (!hasAccess) {
        return { 
          error: 'Access denied', 
          message: 'Your subscription has expired or payment is required to access dashboard',
          subscriptionRequired: true 
        };
      }
    }

    if (!type) {
      const allArtisans = await this.authService.getAllArtisans();
      
      // Filter to only show artisans with active subscriptions
      const activeArtisans: any[] = [];
      for (const artisan of allArtisans) {
        const artisanStatus = await this.subscriptionChecker.checkArtisanSubscription(artisan.email);
        if (artisanStatus?.canAccessDashboard) {
          activeArtisans.push(artisan);
        }
      }
      
      const grouped: Record<string, any[]> = {};
      for (const artisan of activeArtisans) {
        const artType = artisan.artisanType || 'Autre';
        if (!grouped[artType]) grouped[artType] = [];
        grouped[artType].push(artisan);
      }
      return grouped;
    }
    
    // For specific type, also filter by subscription status
    const artisansByType = await this.authService.getArtisansByType(type);
    const activeArtisansByType: any[] = [];
    
    for (const artisan of artisansByType) {
      const artisanStatus = await this.subscriptionChecker.checkArtisanSubscription(artisan.email);
      if (artisanStatus?.canAccessDashboard) {
        activeArtisansByType.push(artisan);
      }
    }
    
    return activeArtisansByType;
  }

  // --- Create embauche relation: User <-> Etablissement ---
  @Post('user/request-embauche')
  async requestEmbaucheUser(@Body() body: { 
    userId: number; 
    etablissementId: number; 
    cv?: string; 
    github?: string; 
    portfolio?: string; 
    linkdin?: string;
    offerId?: number;
  }) {
    const { userId, etablissementId, cv, github, portfolio, linkdin, offerId } = body;
    return this.authService.createUserEmbaucheRequest(userId, etablissementId, { cv, github, portfolio, linkdin }, offerId);
  }


  // --- Create embauche relation: Artisan <-> Etablissement ---
  @Post('artisan/request-embauche')
  async requestEmbaucheArtisan(@Body() body: { artisanId: number; etablissementId: number }) {
    return this.authService.createArtisanEmbaucheRequest(body.artisanId, body.etablissementId);
  }



  // Generic registration
  @Post('register')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
  ], {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const root = path.join(process.cwd(), 'src', 'upload', 'user');
        let dest = root;
        if (file.fieldname === 'cv') {
          dest = path.join(process.cwd(), 'src', 'upload', 'user', 'CV');
        }
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'cv') {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('CV must be PDF or image'), false);
        }
      } else {
        cb(null, true);
      }
    }
  }))
  async register(@UploadedFiles() files: any, @Body() dto: BaseRegisterDto & { role: Role }) {
    console.log('User registration files:', files);
    if (files?.image?.[0]) {
      console.log('Saving user image:', files.image[0].filename, files.image[0].path);
      dto.image = files.image[0].filename;
    } else {
      dto.image = undefined;
      console.log('No user image uploaded');
    }
    if (files?.cv?.[0]) {
      console.log('Saving user CV:', files.cv[0].filename, files.cv[0].path);
      dto.cv = files.cv[0].filename;
    }
    return this.authService.register(dto);
  }
  // --- Verify email for user/artisan/etablissement ---
  @Post('verify-email/:role')
  async verifyEmail(
    @Param('role') role: string,
    @Body() body: { email: string; code: string }
  ) {
    return this.authService.verifyEmail(role, body.email, body.code);
  }

  // --- Resend verification code for user/artisan/etablissement ---
@Post('resend-verification/:role')
async resendVerificationCode(
  @Param('role') role: string,
  @Body() body: { email: string }
) {
  return this.authService.resendVerificationCode(role, body.email);
}


  // --- Etablissements with offres endpoint ---
  @Get('etablissements-with-offres')
  async getEtablissementsWithOffres(@Query('requesterEmail') requesterEmail?: string) {
    // Check if requester has valid subscription to access dashboard
    if (requesterEmail) {
      const userStatus = await this.subscriptionChecker.checkUserSubscription(requesterEmail);
      const artisanStatus = await this.subscriptionChecker.checkArtisanSubscription(requesterEmail);
      const etablissementStatus = await this.subscriptionChecker.checkEtablissementSubscription(requesterEmail);
      
      const hasAccess = userStatus?.canAccessDashboard || 
                       artisanStatus?.canAccessDashboard || 
                       etablissementStatus?.canAccessDashboard;
      
      if (!hasAccess) {
        return { 
          error: 'Access denied', 
          message: 'Your subscription has expired or payment is required to access dashboard',
          subscriptionRequired: true 
        };
      }
    }

    // Get full etablissements with subscription check
    return await this.authService.getEtablissementsWithOffresFiltered();
  }

  // --- Artisans with offres endpoint ---
  @Get('artisans-with-offres')
  async getArtisansWithOffres(@Query('requesterEmail') requesterEmail?: string) {
    // Check if requester has valid subscription to access dashboard
    if (requesterEmail) {
      const userStatus = await this.subscriptionChecker.checkUserSubscription(requesterEmail);
      const artisanStatus = await this.subscriptionChecker.checkArtisanSubscription(requesterEmail);
      const etablissementStatus = await this.subscriptionChecker.checkEtablissementSubscription(requesterEmail);
      
      const hasAccess = userStatus?.canAccessDashboard || 
                       artisanStatus?.canAccessDashboard || 
                       etablissementStatus?.canAccessDashboard;
      
      if (!hasAccess) {
        return { 
          error: 'Access denied', 
          message: 'Your subscription has expired or payment is required to access dashboard',
          subscriptionRequired: true 
        };
      }
    }

    

    // Get full artisans with subscription check
    return await this.authService.getArtisansWithOffresFiltered();
  }

  //---Artisans with avis by type endpoint ---
  @Get('artisans-with-avisbytype')
  async getArtisansWithAvisByType(@Query('type') type?: string) {
    return this.authService.getArtisansWithAvisByType(type);
  }

  @Post('register/etablissement')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'imageOfStatusProof', maxCount: 1 },
  ], {
    storage: diskStorage({
      destination: (req, file, cb) => {
        let dest = path.join(process.cwd(), 'src', 'upload', 'etablissement');
        if (file.fieldname === 'imageOfStatusProof') dest = path.join(process.cwd(), 'src', 'upload', 'etablissement', 'proof');
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
      }
    })
  }))
  async registerEtablissement(@UploadedFiles() files: any, @Body() dto: EtablissementRegisterDto) {
    console.log('Etablissement registration files:', files);
    if (files) {
      if (files.image && files.image[0]) {
        console.log('Saving etablissement image:', files.image[0].filename, files.image[0].path);
        dto.image = files.image[0].filename;
      } else {
        dto.image = undefined;
        console.log('No etablissement image uploaded');
      }
      if (files.imageOfStatusProof && files.imageOfStatusProof[0]) {
        console.log('Saving etablissement status proof:', files.imageOfStatusProof[0].filename, files.imageOfStatusProof[0].path);
        dto.imageOfStatusProof = files.imageOfStatusProof[0].filename;
      } else {
        dto.imageOfStatusProof = undefined;
        console.log('No etablissement status proof uploaded');
      }
    }
    if (files && files.image && files.image.length) {
      const uniqueImages = Array.from(new Set(files.image.map(f => f.filename)));
      dto.image = uniqueImages.length > 0 ? String(uniqueImages[0]) : undefined;
    }
    let mappedType = dto.type;
    if (mappedType.toLowerCase() === 'societes' || mappedType.toLowerCase() === 'societe' || mappedType.toLowerCase() === 'société') mappedType = 'Societe';
    else if (mappedType.toLowerCase() === 'startups' || mappedType.toLowerCase() === 'startup') mappedType = 'Startup';
    else if (mappedType.toLowerCase() === 'agences' || mappedType.toLowerCase() === 'agence') mappedType = 'Agence';
    return this.authService.register({
      ...dto,
      type: mappedType,
      role: Role.ETABLISSEMENT,
    } as any);
  }

  @Post('register/artisana')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
  ], {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = path.join(process.cwd(), 'src', 'upload', 'artisana');
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
      }
    })
  }))
  async registerArtisana(@UploadedFiles() files: any, @Body() dto: ArtisanaRegisterDto) {
    console.log('Artisana registration files:', files);
    if (files && files.image && files.image[0]) {
      console.log('Saving artisana image:', files.image[0].filename, files.image[0].path);
      dto.image = files.image[0].filename;
    } else {
      dto.image = undefined;
      console.log('No artisana image uploaded');
    }
    return this.authService.register({
      ...dto,
      role: Role.ARTISANA,
    } as any);
  }

  // --- List all artisans endpoint ---
  @Get('artisans')
  async getAllArtisans() {
    return this.authService.getAllArtisans();
  }

  // --- List all etablissements endpoint ---
  @Get('etablissements')
  async getAllEtablissements() {
    return this.authService.getAllEtablissements();
  }

  // --- List all users endpoint ---
  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  // --- Login ---
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Put('update-password')
  async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
    return this.authService.updatePassword({
      email: updatePasswordDto.email,
      currentPassword: updatePasswordDto.currentPassword,
      newPassword: updatePasswordDto.newPassword,
      confirmPassword: updatePasswordDto.confirmPassword
    });
  }

  // --- User name endpoint ---
  @Get('user-name')
  async getUserName(@Query('id') id?: string, @Query('email') email?: string) {
    const user = await this.authService.getUserName({ id: id ? +id : undefined, email });
    if (!user) return null;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      image: user.image,
    };
  }

  // --- Artisan name endpoint ---
  @Get('artisan-name')
  async getArtisanName(@Query('id') id?: string, @Query('email') email?: string) {
    const artisan = await this.authService.getArtisanName({ id: id ? +id : undefined, email });
    if (!artisan) return null;
    return {
      id: artisan.id,
      image: artisan.image,
      firstName: artisan.firstName,
      lastName: artisan.lastName,
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
      offres: artisan.artoffres?.map(o => ({
        id: o.id,
        title: o.title,
        description: o.description,
        prix: o.prix,
        imageProofOfWork: o.imageProofOfWork,
      })) ?? [],
      avis: artisan.artavis?.map(a => ({
        id: a.id,
        rate: a.rate,
        comment: a.comment,
      })) ?? [],
    };
  }

  // --- Etablissement info endpoint with user application status ---
  @Get('etablissement-name')
  async getEtablissementName(
    @Query('id') id?: string, 
    @Query('email') email?: string,
    @Query('userId') userId?: string
  ) {
    console.log('=== ETABLISSEMENT-NAME ENDPOINT DEBUG ===');
    console.log('📥 Query parameters:', { id, email, userId });
    
    const etab = await this.authService.getEtablissementName({ id: id ? +id : undefined, email });
    if (!etab) return null;
    
    // Get all embauche requests for this etablissement
    const embaucheRequests = etab.id ? await this.authService.getAllEmbaucheRequestsForEtablissement(etab.id) : [];
    
    console.log('📋 Total embauche requests found:', embaucheRequests.length);
    console.log('🔍 Embauche requests:', embaucheRequests.map(req => ({
      id: req.id,
      offerId: req.offerId,
      userId: req.user?.id,
      status: req.status
    })));
    
    const result = {
      id: etab.id,
      image: etab.image,
      imageOfStatusProof: etab.imageOfStatusProof,
      nameOfEtablissement: etab.nameOfEtablissement,
      email: etab.email,
      employeesCount: etab.employeesCount,
      since: etab.since,
      phone: etab.phone,
      localisation: etab.localisation,
      subscriptionPlan: etab.subscriptionPlan,
      subscriptionStatus: etab.subscriptionStatus,
  paymentStatus: etab.paymentStatus,
      type: etab.type,
      offres: etab.etoffres?.map(o => {
        // Check if the specific user has applied to this offer
        let userApplicationStatus: 'pending' | 'accepted' | 'refused' | null = null;
        if (userId) {
          const userRequest = embaucheRequests.find(req => 
            req.offerId === o.id && 
            req.user?.id === parseInt(userId)
          );
          
          console.log(`🔍 Checking offer ${o.id}:`, {
            userRequestFound: !!userRequest,
            userRequestStatus: userRequest?.status,
            lookingForUserId: parseInt(userId),
            requestUserId: userRequest?.user?.id,
            requestOfferId: userRequest?.offerId
          });
          
          if (userRequest) {
            userApplicationStatus = userRequest.status;
          }
        }
        
        // Include all requests for this offer (showing updated status)
        const allRequests = embaucheRequests.filter(req => 
          req.offerId === o.id &&
          (!userId || req.user?.id !== parseInt(userId))
        ).map(req => ({
          requestId: req.id,
          user: req.user ? req.user.id : null,
          artisan: req.artisan ? req.artisan.id : null,
          status: req.status,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt
        }));
        
        console.log(`📊 Offer ${o.id} - User status: ${userApplicationStatus}, Other requests: ${allRequests.length}`);
        
        return {
          id: o.id,
          titre: o.titre,
          description: o.description,
          skills: o.skills,
          typeContrat: o.typeContrat,
          budget: o.budget,
          userApplicationStatus: userApplicationStatus, // User's application status for this offer
          embaucheRequests: allRequests.length > 0 ? allRequests : null // All requests with updated status
        };
      }) ?? []
    };
    
    console.log('✅ Final result userApplicationStatus:', 
      result.offres.map(offre => ({ 
        offerId: offre.id, 
        status: offre.userApplicationStatus 
      }))
    );
    
    return result;
  }
  // --- Update embaucheRequest status and updatedAt ---
  @Put('embauche-request-status-update/etablissement-name')
  async updateEmbaucheRequestStatus(
    @Body() body: { requestId: number; status: 'pending' | 'accepted' | 'refused' }
  ) {
    if (!body.requestId || !body.status) {
      return { message: 'Missing requestId or status' };
    }
    return this.authService.updateEmbaucheRequestStatus(body.requestId, body.status);
  }

  // Debug endpoint to get all embauche requests
  @Get('debug/embauche-requests')
  async debugEmbaucheRequests(@Query('etablissementId') etablissementId: string) {
    return this.authService.debugEmbaucheRequests(Number(etablissementId));
  }

  // Debug endpoint to update offerId
  @Put('debug/update-offer')
  async updateOfferId(@Body() body: { requestId: number; offerId: number }) {
    return this.authService.debugUpdateOfferId(body.requestId, body.offerId);
  }

  // --- Alternative endpoint for etablissement with detailed user status ---
  @Get('etablissement-with-user-status')
  async getEtablissementWithUserStatus(
    @Query('etablissementId') etablissementId: string,
    @Query('userId') userId: string
  ) {
    const etab = await this.authService.getEtablissementName({ id: parseInt(etablissementId) });
    if (!etab) return null;
    
    const embaucheRequests = await this.authService.getAllEmbaucheRequestsForEtablissement(etab.id);
    
    return {
      id: etab.id,
      image: etab.image,
      imageOfStatusProof: etab.imageOfStatusProof,
      nameOfEtablissement: etab.nameOfEtablissement,
      email: etab.email,
      employeesCount: etab.employeesCount,
      since: etab.since,
      phone: etab.phone,
      localisation: etab.localisation,
      subscriptionPlan: etab.subscriptionPlan,
      subscriptionStatus: etab.subscriptionStatus,
      type: etab.type,
      offres: etab.etoffres?.map(o => {
        const userRequest = embaucheRequests.find(req => 
          req.offerId === o.id && 
          req.user?.id === parseInt(userId)
        );
        
        const userApplicationStatus = userRequest ? userRequest.status : null;
        
        const otherPendingRequests = embaucheRequests.filter(req => 
          req.offerId === o.id && 
          req.status === 'pending' &&
          req.user?.id !== parseInt(userId)
        ).map(req => ({
          requestId: req.id,
          user: req.user ? { 
            id: req.user.id, 
            firstName: req.user.firstName, 
            lastName: req.user.lastName 
          } : null,
          artisan: req.artisan ? { 
            id: req.artisan.id, 
            firstName: req.artisan.firstName, 
            lastName: req.artisan.lastName 
          } : null,
          status: req.status,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt
        }));
        
        return {
          id: o.id,
          titre: o.titre,
          description: o.description,
          skills: o.skills,
          typeContrat: o.typeContrat,
          budget: o.budget,
          userApplicationStatus: userApplicationStatus,
          embaucheRequests: otherPendingRequests.length > 0 ? otherPendingRequests : null
        };
      }) ?? []
    };
  }

  // --- Accept embauche request ---
  @Put('embauche-request/accept')
  async acceptEmbaucheRequest(@Body() body: EmbaucheRequestActionDto) {
    if (!body.requestId || typeof body.requestId !== 'number' || isNaN(body.requestId)) {
      return { message: 'Missing or invalid requestId' };
    }
    return this.authService.acceptEmbaucheRequest(body.requestId);
  }
  

  // --- Refuse embauche request ---
  @Put('embauche-request/refuse')
  async refuseEmbaucheRequest(@Body() body: EmbaucheRequestActionDto) {
    if (!body.requestId || typeof body.requestId !== 'number' || isNaN(body.requestId)) {
      return { message: 'Missing or invalid requestId' };
    }
    return this.authService.refuseEmbaucheRequest(body.requestId);
  }

  @Put('update-email')
  async updateEmail(@Body() updateEmailDto: UpdateEmailDto) {
    return this.authService.updateEmail({
      currentEmail: updateEmailDto.currentEmail,
      newEmail: updateEmailDto.newEmail,
      password: updateEmailDto.password
    });
  }

  @Put('update-subscription')
  async updateSubscription(@Body() updateSubscriptionDto: { email: string; subscriptionPlan: string }) {
    return this.authService.updateSubscription({
      email: updateSubscriptionDto.email,
      subscriptionPlan: updateSubscriptionDto.subscriptionPlan
    });
  }

  // --- Update user profile image ---
  @Put('user/:id/update-image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = path.join(process.cwd(), 'src', 'upload', 'user');
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPG, JPEG and PNG files are allowed'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async updateUserImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any
  ) {
    if (!file) {
      return { 
        success: false, 
        message: 'No image file provided' 
      };
    }

    try {
      console.log('Updating user image for id:', id);
      console.log('File uploaded:', file.filename);
      
      // Update user image in database
      const result = await this.authService.updateUserImage(id, file.filename);
      
      if (!result) {
        // Clean up uploaded file if user not found
        if (file && file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return { 
          success: false, 
          message: 'User not found' 
        };
      }
      
      return { 
        success: true, 
        message: 'Image uploaded successfully',
        filename: file.filename,
        imageUrl: `/upload/user/${file.filename}`
      };
    } catch (error) {
      console.error('Error updating user image:', error);
      
      // Clean up uploaded file if there's an error
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return { 
        success: false, 
        message: 'Failed to update image' 
      };
    }
  }

  // --- Update etablissement profile image ---
  @Put('etablissement/:id/update-image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = path.join(process.cwd(), 'src', 'upload', 'etablissement');
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPG, JPEG and PNG files are allowed'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async updateEtablissementImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any
  ) {
    if (!file) {
      return { 
        success: false, 
        message: 'No image file provided' 
      };
    }

    try {
      console.log('Updating etablissement image for id:', id);
      console.log('File uploaded:', file.filename);
      
      const result = await this.authService.updateEtablissementImage(id, file.filename);
      
      if (!result) {
        if (file && file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return { 
          success: false, 
          message: 'Etablissement not found' 
        };
      }
      
      return { 
        success: true, 
        message: 'Image uploaded successfully',
        filename: file.filename,
        imageUrl: `/upload/etablissement/${file.filename}`
      };
    } catch (error) {
      console.error('Error updating etablissement image:', error);
      
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return { 
        success: false, 
        message: 'Failed to update image' 
      };
    }
  }

  // --- Update artisana profile image ---
  @Put('artisan/:id/update-image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = path.join(process.cwd(), 'src', 'upload', 'artisana');
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPG, JPEG and PNG files are allowed'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  async updateArtisanaImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any
  ) {
    if (!file) {
      return { 
        success: false, 
        message: 'No image file provided' 
      };
    }

    try {
      console.log('Updating artisana image for id:', id);
      console.log('File uploaded:', file.filename);
      
      const result = await this.authService.updateArtisanaImage(id, file.filename);
      
      if (!result) {
        if (file && file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return { 
          success: false, 
          message: 'Artisana not found' 
        };
      }
      
      return { 
        success: true, 
        message: 'Image uploaded successfully',
        filename: file.filename,
        imageUrl: `/upload/artisana/${file.filename}`
      };
    } catch (error) {
      console.error('Error updating artisana image:', error);
      
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      
      return { 
        success: false, 
        message: 'Failed to update image' 
      };
    }
  }

  // --- Admin endpoints ---
  @Get('admin/subscriptions')
  async getAllSubscriptions() {
    return [];
  }

  @Get('admin/payments')
  async getAllPayments() {
    return [];
  }
}