import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { corsLink } from '../config/constants';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Middleware para logging de requests (solo en producción para debugging)
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.path.includes('verify-whatsapp')) {
        console.log(`[REQUEST] ${req.method} ${req.path}`, {
          headers: req.headers,
          body: req.body
            ? JSON.stringify(req.body).substring(0, 200)
            : 'No body',
        });
      }
      next();
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Zamr API')
    .setDescription(
      'API REST para la gestión de bandas de adoración, eventos, canciones e iglesias',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Endpoints de autenticación y autorización')
    .addTag('users', 'Gestión de usuarios')
    .addTag('bands', 'Gestión de bandas de adoración')
    .addTag('churches', 'Gestión de iglesias')
    .addTag('Events of Bands', 'Gestión de eventos y servicios')
    .addTag('songs', 'Catálogo de canciones')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Middleware global para manejar request aborted
  app.use((req, res, next) => {
    req.on('aborted', () => {
      console.log(`[ABORTED] Request aborted: ${req.method} ${req.path}`);
    });
    next();
  });

  app.enableCors({
    origin: corsLink,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false, // No necesitamos credentials con JWT
  });
  app.set('trust proxy', 1);
  const isProduction = process.env.NODE_ENV === 'production';
  const host = isProduction ? '0.0.0.0' : process.env.IPDEV;
  await app.listen(process.env.PORT || 3000, host);
}
bootstrap();
