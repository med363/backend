import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS for all origins (since nginx will handle external traffic)
  app.enableCors({
    origin: true, // Allow all origins when behind nginx
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3000;  // ← FIX: Change back to 3000

  // Serve static files from upload directory
  app.useStaticAssets(join(__dirname, '..', 'src', 'upload'), {
    prefix: '/upload/',
  });

  console.log('📁 Static files served from:', join(__dirname, '..', 'src', 'upload'));
  console.log('📁 Expected CV path: src/upload/user/CV/');

  await app.listen(port, '0.0.0.0');  // ← FIX: Bind to all interfaces
  console.log(`Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();
