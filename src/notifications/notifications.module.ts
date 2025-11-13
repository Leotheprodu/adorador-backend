import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MembershipsModule } from '../memberships/memberships.module';

@Module({
  imports: [forwardRef(() => AuthModule), MembershipsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, PrismaService],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
