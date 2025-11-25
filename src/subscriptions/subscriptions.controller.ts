import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  ParseIntPipe,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { CheckLoginStatus } from '../auth/decorators/permissions.decorators';
import { catchHandle } from '../chore/utils/catchHandle';
import {
  ApiGetPlans,
  ApiGetBandSubscription,
  ApiGetBandLimits,
  ApiCancelSubscription,
} from './subscriptions.swagger';

@Controller('subscriptions')
@ApiTags('subscriptions')
@UseGuards(PermissionsGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly prisma: PrismaService,
  ) { }

  @ApiGetPlans()
  @Get('plans')
  async getPlans(@Res() res: Response) {
    try {
      const plans = await this.prisma.subscriptionPlans.findMany({
        where: { active: true },
        orderBy: { price: 'asc' },
      });

      if (!plans || plans.length === 0) {
        throw new HttpException(
          'No subscription plans found',
          HttpStatus.NOT_FOUND,
        );
      }

      res.send(plans);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetBandSubscription()
  @Get('band/:bandId')
  @CheckLoginStatus('loggedIn')
  async getBandSubscription(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const subscription =
        await this.subscriptionsService.getSubscriptionByBandId(bandId);

      if (!subscription) {
        throw new HttpException(
          'Subscription not found for this band',
          HttpStatus.NOT_FOUND,
        );
      }

      res.send(subscription);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetBandLimits()
  @Get('band/:bandId/limits')
  @CheckLoginStatus('loggedIn')
  async getBandLimits(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const subscription =
        await this.subscriptionsService.getSubscriptionByBandId(bandId);

      if (!subscription) {
        res.send({ hasSubscription: false });
        return;
      }

      const plan = subscription.plan;

      // Obtener uso actual
      const currentMembers = await this.prisma.membersofBands.count({
        where: { bandId },
      });
      const currentSongs = await this.prisma.songs.count({ where: { bandId } });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const currentEvents = await this.prisma.events.count({
        where: {
          bandId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });

      res.send({
        hasSubscription: true,
        plan: plan,
        usage: {
          members: currentMembers,
          songs: currentSongs,
          events: currentEvents,
        },
        limits: {
          maxMembers: plan.maxMembers,
          maxSongs: plan.maxSongs,
          maxEvents: plan.maxEventsPerMonth,
        },
      });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiCancelSubscription()
  @Delete('band/:bandId')
  @CheckLoginStatus('loggedIn')
  async cancelSubscription(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const result = await this.subscriptionsService.cancelSubscription(bandId);

      if (!result) {
        throw new HttpException(
          'Failed to cancel subscription',
          HttpStatus.BAD_REQUEST,
        );
      }

      res.send({
        message: 'Subscription cancelled successfully',
        subscription: result,
      });
    } catch (e) {
      catchHandle(e);
    }
  }
}
