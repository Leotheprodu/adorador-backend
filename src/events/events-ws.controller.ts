import {
  Controller,
  Post,
  Body,
  UseGuards,
  Session,
  HttpStatus,
  Res,
  HttpException,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { EventsGateway } from './events.gateway';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtPayload } from '../auth/services/jwt.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { CheckLoginStatus } from '../auth/decorators/permissions.decorators';
import { catchHandle } from '../chore/utils/catchHandle';
import { checkAdminHandle } from '../auth/utils/checkAdminHandle';
import { EventsService } from './events.service';

export type lyricSelectedProps = {
  position: number;
  action: 'forward' | 'backward';
};
@UseGuards(PermissionsGuard)
@Controller('events-ws')
export class EventsGatewayController {
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly eventsService: EventsService,
  ) {}

  @CheckLoginStatus('loggedIn')
  @Post('event-selected-song')
  async handleEventSelectedSong(
    @Body() body: { id: string; message: number },
    @Res() res: Response,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const eventName = `eventSelectedSong-${body.id}`;
      const eventManagerId = await this.eventsGateway.getBandManagerIdByEventId(
        parseInt(body.id),
      );
      if (!eventManagerId && !checkAdminHandle(user)) {
        throw new HttpException(
          'Event Manager not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (user.sub === eventManagerId || checkAdminHandle(user)) {
        this.eventsGateway.storeMessage(eventName, {
          message: body.message,
          eventAdmin: user.name,
        });
        this.eventsGateway.server.emit(eventName, {
          message: body.message,
          eventAdmin: user.name,
        });
        res.status(HttpStatus.ACCEPTED).send({ status: 'success' });
      } else {
        throw new HttpException(
          'Insufficient permissions to manage this event',
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (e) {
      catchHandle(e);
    }
  }
  @CheckLoginStatus('loggedIn')
  @Post('lyric-selected')
  async handleLyricSelected(
    @Body() body: { id: string; message: lyricSelectedProps },
    @GetUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    try {
      const eventName = `lyricSelected-${body.id}`;
      const eventManagerId = await this.eventsGateway.getBandManagerIdByEventId(
        parseInt(body.id),
      );
      if (!eventManagerId && !checkAdminHandle(user)) {
        throw new HttpException(
          'Event Manager not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (user.sub === eventManagerId || checkAdminHandle(user)) {
        this.eventsGateway.storeMessage(eventName, {
          message: body.message,
          eventAdmin: user.name,
        });
        this.eventsGateway.server.emit(eventName, {
          message: body.message,
          eventAdmin: user.name,
        });
        res.status(HttpStatus.ACCEPTED).send({ status: 'success' });
      } else {
        throw new HttpException(
          'Insufficient permissions to manage this event',
          HttpStatus.FORBIDDEN,
        );
      }
    } catch (e) {
      catchHandle(e);
    }
  }

  // 📊 Endpoints de métricas para monitoreo

  /**
   * Obtener métricas generales del sistema WebSocket
   * Uso: GET /events-ws/metrics
   */
  @Get('metrics')
  getSystemMetrics() {
    try {
      const metrics = this.eventsGateway.getSystemMetrics();
      const memoryUsage = process.memoryUsage();

      return {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        websocket: metrics,
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsedPercent: Math.round(
            (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
          ),
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        },
      };
    } catch (e) {
      throw new HttpException(
        'Error getting metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtener métricas de un evento específico
   * Uso: GET /events-ws/metrics/event/:eventId
   */
  @Get('metrics/event/:eventId')
  getEventMetrics(@Param('eventId', ParseIntPipe) eventId: number) {
    try {
      const metrics = this.eventsGateway.getEventMetrics(eventId);

      if (!metrics) {
        return {
          eventId,
          message: 'No users connected to this event',
          totalUsers: 0,
          authenticatedUsers: 0,
          guestUsers: 0,
          usersList: [],
        };
      }

      return {
        eventId,
        timestamp: new Date().toISOString(),
        ...metrics,
      };
    } catch (e) {
      throw new HttpException(
        'Error getting event metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check básico
   * Uso: GET /events-ws/health
   */
  @Get('health')
  healthCheck() {
    const connectedClients = this.eventsGateway.getConnectedClientsCount();
    const activeEvents = this.eventsGateway.getActiveEventsCount();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      connectedClients,
      activeEvents,
    };
  }
}
