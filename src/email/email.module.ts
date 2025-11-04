import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { TemporalTokenPoolModule } from '../temporal-token-pool/temporal-token-pool.module';
@Module({
  providers: [EmailService, PrismaService],
  imports: [
    TemporalTokenPoolModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for 587
          auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
          },
          // Gmail specific optimizations
          tls: {
            rejectUnauthorized: false,
          },
          // Optimized timeouts for cloud servers
          connectionTimeout: 15000, // 15 seconds
          greetingTimeout: 10000, // 10 seconds
          socketTimeout: 15000, // 15 seconds
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
