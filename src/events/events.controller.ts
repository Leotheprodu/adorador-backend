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
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreateEvent,
  ApiGetAllEvents,
  ApiGetEvent,
  ApiUpdateEvent,
  ApiDeleteEvent,
  ApiAddSongsToEvent,
  ApiRemoveSongsFromEvent,
  ApiUpdateEventSongs,
} from './events.swagger';
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
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { JwtPayload } from 'src/auth/services/jwt.service';
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

  @ApiCreateEvent()
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
    @GetUser() user: JwtPayload,
  ) {
    try {
      const event = await this.eventsService.create(createEventDto, bandId);
      if (!event) {
        throw new HttpException(
          'Failed to create event',
          HttpStatus.BAD_REQUEST,
        );
      }
      res.status(HttpStatus.CREATED).send(event);
    } catch (e) {
      catchHandle(e);
    }
  }
  @ApiGetAllEvents()
  @Get()
  @CheckLoginStatus('loggedIn')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
  }) */
  async findAll(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const events = await this.eventsService.findAll(bandId);
      if (!events) {
        throw new HttpException('No events found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(events);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetEvent()
  @Get(':id')
  @CheckLoginStatus('public')
  // Endpoint público - permite acceso con o sin autenticación
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
  @ApiUpdateEvent()
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
      // Verificar que el evento exista
      const existingEvent = await this.eventsService.findOne(id, bandId);
      if (!existingEvent) {
        throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }

      // Verificar que el evento no haya pasado
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const eventDate = new Date(existingEvent.date);
      eventDate.setHours(0, 0, 0, 0);

      if (eventDate < currentDate) {
        throw new HttpException(
          'Cannot update past events',
          HttpStatus.BAD_REQUEST,
        );
      }

      const event = await this.eventsService.update(id, updateEventDto, bandId);
      if (!event) {
        throw new HttpException('Event not updated', HttpStatus.BAD_REQUEST);
      }
      res.status(HttpStatus.OK).send(event);
    } catch (e) {
      catchHandle(e);
    }
  }
  @ApiDeleteEvent()
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

  @ApiAddSongsToEvent()
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

      // Notificar cambios en el evento a todos los usuarios conectados
      const eventUpdateEvent = `eventSongsUpdated-${id}`;
      this.eventsGateway.server.emit(eventUpdateEvent, {
        eventId: id,
        bandId: bandId,
        changeType: 'songs_added',
        timestamp: new Date().toISOString(),
        message: 'Se agregaron nuevas canciones al evento',
      });

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

      // Notificar cambios en el evento a todos los usuarios conectados
      const eventUpdateEvent = `eventSongsUpdated-${id}`;
      this.eventsGateway.server.emit(eventUpdateEvent, {
        eventId: id,
        bandId: bandId,
        changeType: 'songs_removed',
        timestamp: new Date().toISOString(),
        message: 'Se eliminaron canciones del evento',
      });

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

      // Notificar cambios en el evento a todos los usuarios conectados
      const eventUpdateEvent = `eventSongsUpdated-${id}`;
      this.eventsGateway.server.emit(eventUpdateEvent, {
        eventId: id,
        bandId: bandId,
        changeType: 'songs_updated',
        timestamp: new Date().toISOString(),
        message:
          'Se actualizaron las canciones del evento (escalas, orden, etc.)',
      });

      res.status(HttpStatus.OK).send({ message: 'Songs updated' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id/songs')
  @CheckLoginStatus('public')
  // Endpoint público - permite ver las canciones de un evento
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
    @GetUser() user: JwtPayload,
  ) {
    try {
      const bandMember = await this.eventsService.changeBandEventManager(
        bandId,
        user.sub,
      );
      const userName = user.name;
      const eventName = `eventSelectedSong-${id}`;

      if (bandMember) {
        // CRITICAL: Actualizar el caché del event manager
        this.eventsGateway.changeEventManager(id, user.sub);

        const lastMessage = this.eventsGateway.getLastMessage(eventName);

        // Notificar cambio de event manager a todos los usuarios conectados
        const eventManagerChangeEvent = `eventManagerChanged-${id}`;
        this.eventsGateway.server.emit(eventManagerChangeEvent, {
          newEventManagerId: user.sub,
          newEventManagerName: userName,
          eventId: id,
          bandId: bandId,
          timestamp: new Date().toISOString(),
        });

        // También mantener la notificación original por compatibilidad
        this.eventsGateway.server.emit(eventName, {
          message: lastMessage,
          eventAdmin: userName,
        });

        res
          .status(HttpStatus.OK)
          .send({ message: 'Event manager changed', eventManager: userName });
      } else {
        if (!bandMember) {
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
