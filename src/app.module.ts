import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ChurchesModule } from './churches/churches.module';
import { ServicesModule } from './services/services.module';
import { SongsModule } from './songs/songs.module';
import { MembershipsModule } from './memberships/memberships.module';

@Module({
  imports: [UsersModule, AuthModule, EmailModule, ChurchesModule, ServicesModule, SongsModule, MembershipsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
