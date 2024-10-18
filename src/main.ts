import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { corsLink, environment } from 'config/constants';
import * as expressSession from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
    origin: [corsLink],
    credentials: true,
  });
  app.use(
    expressSession({
      name: 'sessionId',
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: environment === 'production',
        sameSite: environment === 'production' ? 'none' : false,
      },
      secret: 'vive en una piña debajo del mar',
      resave: true,
      saveUninitialized: false,
      store: new PrismaSessionStore(new PrismaClient(), {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
        sessionModelName: 'session',
      }),
    }),
  );
  app.set('trust proxy', 1);
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
