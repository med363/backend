import { Controller, Post, Body, Get, Param, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { PostulerOfferForArtisanaService } from './postulerofferforartisana.service';
import { PostulerOfferForArtisanaDto } from './dto/postulerofferforartisana.dto';

@Controller('artisana-postuler')
export class PostulerOfferForArtisanaController {
  constructor(private readonly postulerService: PostulerOfferForArtisanaService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'imageProofOfWork', maxCount: 5 },
    ], {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dest = path.join(process.cwd(), 'src', 'upload', 'artisana', 'work proof');
          cb(null, dest);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          cb(null, name);
        }
      }),
      fileFilter: (req, file, cb) => {
        if (file.fieldname === 'imageProofOfWork') {
          if (["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Image must be PNG, JPEG, or JPG'), false);
          }
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async postuler(@UploadedFiles() files: any, @Body() dto: PostulerOfferForArtisanaDto) {
    if (files && files.imageProofOfWork && files.imageProofOfWork.length) {
      // Remove duplicate filenames
      const filenames = files.imageProofOfWork.map(f => f.filename);
      dto.imageProofOfWork = Array.from(new Set(filenames));
    }
    return this.postulerService.create(dto);
  }


  @Get(':artisanId')
  async getPostulerByArtisan(@Param('artisanId') artisanId: number) {
    return this.postulerService.getByArtisan(artisanId);
  }
}
