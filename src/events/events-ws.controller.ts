import {
  Controller,
  Post,
  Body,
  UseGuards,
  Session,
  HttpStatus,
  Res,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { EventsGateway } from './events.gateway';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtPayload } from 'src/auth/services/jwt.service';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { CheckLoginStatus } from 'src/auth/decorators/permissions.decorators';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { checkAdminHandle } from 'src/auth/utils/checkAdminHandle';
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
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
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
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
    } catch (e) {
      catchHandle(e);
    }
  }
}
