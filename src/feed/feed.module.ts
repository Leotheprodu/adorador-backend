import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { FeedGateway } from './feed.gateway';
import { PrismaService } from '../prisma.service';
import { MembershipsService } from '../memberships/memberships.service';

@Module({
  controllers: [FeedController],
  providers: [FeedService, FeedGateway, PrismaService, MembershipsService],
  exports: [FeedService],
})
export class FeedModule {}
