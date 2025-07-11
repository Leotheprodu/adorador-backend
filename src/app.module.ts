import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ChurchesModule } from './churches/churches.module';
import { EventsModule } from './events/events.module';
import { SongsModule } from './songs/songs.module';
import { MembershipsModule } from './memberships/memberships.module';
import { ChurchRolesModule } from './church-roles/church-roles.module';
import { ChurchMemberRolesModule } from './church-member-roles/church-member-roles.module';
import { SongsLyricsModule } from './songs-lyrics/songs-lyrics.module';
import { SongsChordsModule } from './songs-chords/songs-chords.module';
import { TemporalTokenPoolModule } from './temporal-token-pool/temporal-token-pool.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BandsModule } from './bands/bands.module';
@Module({
  imports: [
    UsersModule,
    AuthModule,
    EmailModule,
    ChurchesModule,
    EventsModule,
    SongsModule,
    MembershipsModule,
    ChurchRolesModule,
    ChurchMemberRolesModule,
    SongsLyricsModule,
    SongsChordsModule,
    TemporalTokenPoolModule,
    ScheduleModule.forRoot(),
    BandsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
