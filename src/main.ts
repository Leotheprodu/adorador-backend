import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { corsLink } from 'config/constants';
import { NestExpressApplication } from '@nestjs/platform-express';
import { sessionMiddleware } from './auth/middlewares/session.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(sessionMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Adorador API')
    .setDescription(' API para la aplicación de Adorador')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: corsLink,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.set('trust proxy', 1);
  const isProduction = process.env.NODE_ENV === 'production';
  const host = isProduction ? '0.0.0.0' : process.env.IPDEV;
  await app.listen(process.env.PORT || 3000, host);
}
bootstrap();
