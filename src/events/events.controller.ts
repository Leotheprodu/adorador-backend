import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpException,
  ParseIntPipe,
  Res,
  Query,
  ParseBoolPipe,
  Session,
  Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import {
  CheckChurch,
  CheckLoginStatus,
} from 'src/auth/decorators/permissions.decorators';
import { churchRoles } from 'config/constants';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { Response } from 'express';
import {
  AddSongsToEventDto,
  RemoveSongsToEventDto,
} from './dto/add-songs-to-event.dto';
import { SessionData } from 'express-session';
import { EventsGateway } from './events.gateway';
import { UpdateSongsEventDto } from './dto/update-songs-to-event.dto';

@Controller('bands/:bandId/events')
@ApiTags('Events of Bands')
@UseGuards(PermissionsGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @ApiOperation({ summary: 'Create Service' })
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
    churchRolesBypass: [
      churchRoles.eventWebManager.id,
      churchRoles.worshipLeader.id,
      churchRoles.musician.id,
    ],
  }) */
  @Post()
  async create(
    @Body() createEventDto: CreateEventDto,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Session() session: SessionData,
  ) {
    try {
      const service = await this.eventsService.create(createEventDto, bandId);
      if (!service) {
        throw new HttpException(
          'Failed to create service',
          HttpStatus.BAD_REQUEST,
        );
      }
      res.status(HttpStatus.CREATED).send(service);
    } catch (e) {
      catchHandle(e);
    }
  }
  @Get()
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
  }) */
  async findAll(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Query('includeAllDates') includeAllDates: string,
  ) {
    try {
      const parsedIncludeAllDates =
        includeAllDates !== undefined && includeAllDates
          ? JSON.parse(includeAllDates)
          : false;
      const events = await this.eventsService.findAll(
        bandId,
        parsedIncludeAllDates,
      );
      if (!events) {
        throw new HttpException('No events found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(events);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const event = await this.eventsService.findOne(id, bandId);
      if (!event) {
        throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(event);
    } catch (e) {
      catchHandle(e);
    }
  }
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  }) */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    try {
      const event = await this.eventsService.update(id, updateEventDto, bandId);
      if (!event) {
        throw new HttpException('Event not updated', HttpStatus.BAD_REQUEST);
      }
      res.status(HttpStatus.OK).send(event);
    } catch (e) {
      catchHandle(e);
    }
  }
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  }) */
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const event = await this.eventsService.remove(id, bandId);
      if (!event) {
        throw new HttpException('Event not deleted', HttpStatus.BAD_REQUEST);
      }
      res.status(HttpStatus.OK).send({ message: 'Event deleted' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post(':id/songs')
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  }) */
  async addSongsToEvent(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Body() addSongsToEventDto: AddSongsToEventDto,
  ) {
    try {
      /* const songs = this.eventsService.getEventSongs(id); */
      //NOTE Hay que revisar el order de las songs porque no pueden haber dos canciones con el mismo order

      const event = await this.eventsService.addSongsToEvent(
        id,
        addSongsToEventDto,
      );
      if (!event) {
        throw new HttpException(
          'Songs not added to event',
          HttpStatus.BAD_REQUEST,
        );
      }
      res.status(HttpStatus.OK).send(event);
    } catch (e) {
      catchHandle(e);
    }
  }
  @Delete(':id/songs')
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  }) */
  async deleteSongsToEvent(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Body() songs: RemoveSongsToEventDto,
  ) {
    try {
      console.log(songs);
      const event = await this.eventsService.deleteSongsFromEvent(id, songs);
      console.log(event);
      res.status(HttpStatus.OK).send({ message: 'Songs removed from event' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch(':id/songs')
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  }) */
  async updateEventSongs(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Body() updateSongsEventDto: UpdateSongsEventDto,
  ) {
    try {
      const event = await this.eventsService.updateSongsEvent(
        id,
        updateSongsEventDto,
      );
      /* if (!event) {
        throw new HttpException(
          'Songs not updated to event',
          HttpStatus.BAD_REQUEST,
        );
      } */
      res.status(HttpStatus.OK).send({ message: 'Songs updated' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id/songs')
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
  }) */
  async getEventSongs(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const songs = await this.eventsService.getEventSongs(id, bandId);
      if (!songs) {
        throw new HttpException('No songs found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(songs);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id/change-event-manager')
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
    churchRolesBypass: [
      churchRoles.worshipLeader.id,
      churchRoles.musician.id,
      churchRoles.eventWebManager.id,
    ],
  }) */
  async changeEventManager(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Session() session: SessionData,
  ) {
    try {
      const event = await this.eventsService.changeEventManager(
        bandId,
        session.userId,
        id,
      );
      const userName = session.name;
      const eventName = `eventSelectedSong-${id}`;

      if (event) {
        const lastMessage = this.eventsGateway.getLastMessage(eventName);
        // Optionally update the isEventManager property for the correct member
        session.membersofBands = session.membersofBands.map((member) =>
          member.band.id === bandId
            ? { ...member, isEventManager: true }
            : member,
        );
        this.eventsGateway.server.emit(eventName, {
          message: lastMessage,
          eventAdmin: userName,
        });
        res
          .status(HttpStatus.OK)
          .send({ message: 'Event manager changed', eventManager: userName });
      } else {
        if (!event) {
          throw new HttpException(
            'Event manager not changed',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    } catch (e) {
      catchHandle(e);
    }
  }
}
