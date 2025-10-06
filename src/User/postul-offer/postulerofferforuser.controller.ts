import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  UseInterceptors, 
  UploadedFile, 
  UsePipes, 
  ValidationPipe, 
  ParseIntPipe,
  Res,
  NotFoundException
} from '@nestjs/common';
import { PostulerOfferForUserService } from './postulerofferforuser.service';
import { PostulerOfferForUserDto } from './dto/postulerofferforuser.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Multer } from 'multer';
import type { Response } from 'express';
import * as fs from 'fs';

@Controller('user-postuler')
export class PostulerOfferForUserController {
  constructor(private readonly postulerService: PostulerOfferForUserService) {}

  @Post('request-embauche/:etablissementId')
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'src', 'upload', 'user', 'CV'),
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname);
          cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF and image files are allowed!'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  async postuler(
    @Param('etablissementId', ParseIntPipe) etablissementId: number,
    @UploadedFile() file: Multer.File,
    @Body() dto: PostulerOfferForUserDto
  ) {
    console.log('📥 Received application:', {
      etablissementId,
      dto,
      file: file ? file.filename : 'No file',
      types: {
        offerId: typeof dto.offerId,
        userId: typeof dto.userId,
        etablissementId: typeof etablissementId
      }
    });

    if (file) {
      dto.cv = file.filename;
    }

    return this.postulerService.create(dto, etablissementId);
  }

  @Get(':userId')
  async getPostulerByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.postulerService.getByUser(userId);
  }

  @Get()
  async getAllPostulants() {
    return this.postulerService.getAllPostulantsWithRequests();
  }

  @Post('reset-notification/:etablissementId')
  async resetNotification(@Param('etablissementId', ParseIntPipe) etablissementId: number) {
    return this.postulerService.resetNotification(etablissementId);
  }

  // Debug endpoint to serve CV files
  @Get('debug/cv/:filename')
  async getCVFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      // Try different possible paths
      const possiblePaths = [
        path.join(process.cwd(), 'src', 'upload', 'user', 'CV', filename),
        path.join(process.cwd(), 'upload', 'user', 'CV', filename),
        path.join(__dirname, '..', '..', 'upload', 'user', 'CV', filename),
      ];

      console.log('🔍 Looking for CV file:', filename);
      
      let filePath = '';
      for (const possiblePath of possiblePaths) {
        console.log('Checking path:', possiblePath);
        if (fs.existsSync(possiblePath)) {
          filePath = possiblePath;
          console.log('✅ File found at:', filePath);
          break;
        }
      }

      if (!filePath) {
        console.log('❌ File not found in any location');
        return res.status(404).json({ message: 'File not found' });
      }

      // Send the file
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error serving CV file:', error);
      return res.status(500).json({ message: 'Error serving file' });
    }
  }

  // Debug endpoint to list files
  @Get('debug/files')
  async debugFiles() {
    const cvDir = path.join(process.cwd(), 'src', 'upload', 'user', 'CV');
    const uploadDir = path.join(process.cwd(), 'src', 'upload');
    
    console.log('📁 Current working directory:', process.cwd());
    console.log('📁 CV directory path:', cvDir);
    console.log('📁 Upload directory path:', uploadDir);
    
    try {
      const cvFiles = fs.existsSync(cvDir) ? fs.readdirSync(cvDir) : [];
      const uploadDirs = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
      
      return {
        cvDirectoryExists: fs.existsSync(cvDir),
        cvFiles: cvFiles,
        uploadDirectoryExists: fs.existsSync(uploadDir),
        uploadDirectories: uploadDirs,
        currentWorkingDir: process.cwd(),
        cvDir: cvDir,
      };
    } catch (error) {
      return {
        error: error.message,
        currentWorkingDir: process.cwd(),
      };
    }
  }

  // Get postulant by ID
  @Get('postulant/:id')
  async getPostulantById(@Param('id', ParseIntPipe) id: number) {
    return this.postulerService.getPostulantById(id);
  }
}