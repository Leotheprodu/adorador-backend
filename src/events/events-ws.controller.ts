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
import { SessionData } from 'express-session';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { CheckLoginStatus } from 'src/auth/decorators/permissions.decorators';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { checkAdminHandle } from 'src/auth/utils/checkAdminHandle';

export type lyricSelectedProps = {
  position: number;
  action: 'forward' | 'backward';
};
@UseGuards(PermissionsGuard)
@Controller('events-ws')
export class EventsGatewayController {
  constructor(private readonly eventsGateway: EventsGateway) {}

  @CheckLoginStatus('loggedIn')
  @Post('event-selected-song')
  async handleEventSelectedSong(
    @Body() body: { id: string; message: number },
    @Res() res: Response,
    @Session() session: SessionData,
  ) {
    try {
      const eventName = `eventSelectedSong-${body.id}`;
      const eventManagerId = await this.eventsGateway.getEventManagerId(
        body.id,
      );
      if (session.userId === eventManagerId || checkAdminHandle(session)) {
        this.eventsGateway.storeMessage(eventName, {
          message: body.message,
          eventAdmin: session.name,
        });
        this.eventsGateway.server.emit(eventName, {
          message: body.message,
          eventAdmin: session.name,
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
    @Session() session: SessionData,
    @Res() res: Response,
  ) {
    try {
      const eventName = `lyricSelected-${body.id}`;
      const eventManagerId = await this.eventsGateway.getEventManagerId(
        body.id,
      );
      if (session.userId === eventManagerId || checkAdminHandle(session)) {
        this.eventsGateway.storeMessage(eventName, {
          message: body.message,
          eventAdmin: session.name,
        });
        this.eventsGateway.server.emit(eventName, {
          message: body.message,
          eventAdmin: session.name,
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
