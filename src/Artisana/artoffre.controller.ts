import { Body, Controller, Get, Param, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ArtOffreService } from './artoffre.service';
import { ArtOffreDto } from './dto/artoffre.dto';
import { ArtOffreCreateDto } from './dto/artoffre-create.dto';

@Controller('artoffre')
export class ArtOffreController {
  constructor(private readonly artoffreService: ArtOffreService) {}

  @Post('create')
  async create(@Body() dto: ArtOffreDto) {
    return this.artoffreService.createOffre(dto);
  }

  @Post('create/id=:artisanId')
  @UseInterceptors(FilesInterceptor('images', 10, {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const uploadPath = './src/upload/artisan/work-proof';
        console.log('Uploading file to:', uploadPath);
        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `artisan-work-${uniqueSuffix}${extname(file.originalname)}`;
        console.log('Generated filename:', filename);
        callback(null, filename);
      },
    }),
    fileFilter: (req, file, callback) => {
      console.log('File filter check:', file.originalname, file.mimetype);
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
  }))
  async createWithId(
    @Param('artisanId') artisanId: number, 
    @Body() dto: any, // Use any to handle form data
    @UploadedFiles() files: any[]
  ) {
    console.log('POST /artoffre/create/id=:artisanId called with artisanId:', artisanId);
    console.log('Request body:', dto);
    console.log('Uploaded files:', files?.length || 0);
    
    // Convert uploaded files to image paths array
    const imagePaths = files?.map(file => `/upload/artisan/work-proof/${file.filename}`) || [];
    console.log('Generated image paths:', imagePaths);
    
    // Transform and validate the data from form
    const transformedDto: ArtOffreCreateDto = {
      title: dto.title,
      description: dto.description,
      prix: parseFloat(dto.prix) || 0,
      imageProofOfWork: imagePaths[0] || undefined,
    };
    
    console.log('Transformed DTO:', transformedDto);
    
    const fullDto: ArtOffreDto = { 
      ...transformedDto, 
      artisanId,
      images: imagePaths
    };
    
    return this.artoffreService.createOffre(fullDto);
  }

  @Get('debug/all')
  async getAllOffersDebug() {
    const allOffers = await this.artoffreService.getAllOffers();
    return allOffers.map(o => ({
      id: o.id,
      title: o.title,
      artisanId: o.artisan?.id,
      artisanName: o.artisan ? `${o.artisan.firstName} ${o.artisan.lastName}` : 'No artisan'
    }));
  }

  @Get('artisan/:artisanId')
  async getByArtisan(@Param('artisanId') artisanId: number) {
    console.log('GET /artoffre/artisan/:artisanId called with artisanId:', artisanId);
    
    const offres = await this.artoffreService.getOffresByArtisan(artisanId);
    console.log('Found offers:', offres.length, 'for artisan ID:', artisanId);
    
    if (offres.length > 0) {
      console.log('First offer details:', offres[0]);
    }
    
    // Include imageProofOfWork and images in the response
    return offres.map(o => ({
      id: o.id,
      title: o.title,
      description: o.description,
      prix: o.prix,
      imageProofOfWork: o.imageProofOfWork,
      images: o.images ? JSON.parse(o.images) : [],
      artisan: o.artisan,
    }));
  }
}
