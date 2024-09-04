import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [UsersModule, AuthModule, EmailModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
