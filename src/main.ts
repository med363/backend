import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS for React Native app
  app.enableCors({
    origin: ['http://localhost:8081', 'http://192.168.1.16:8081', 'exp://localhost:19000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  const port = process.env.PORT || 3000;

  // Serve static files from upload directory - CORRECTED
  app.useStaticAssets(join(__dirname, '..', 'src', 'upload'), {
    prefix: '/upload/',
  });

  console.log('📁 Static files served from:', join(__dirname, '..', 'src', 'upload'));
  console.log('📁 Expected CV path: src/upload/user/CV/');

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();