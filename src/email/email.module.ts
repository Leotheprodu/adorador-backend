import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from 'src/prisma.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { TemporalTokenPoolModule } from 'src/temporal-token-pool/temporal-token-pool.module';
@Module({
  providers: [EmailService, PrismaService],
  imports: [
    TemporalTokenPoolModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true' || false,
          requireTLS: true,
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
          // Configuration for better compatibility
          tls: {
            rejectUnauthorized: false,
          },
          // Connection timeouts
          connectionTimeout: 20000, // 20 seconds
          greetingTimeout: 15000, // 15 seconds
          socketTimeout: 20000, // 20 seconds
        },
        defaults: {
          from: process.env.EMAIL_USERNAME,
        },
        template: {
          dir: __dirname + '/../../config/templates',
          adapter: new EjsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
    }),
  ],
})
export class EmailModule {}
