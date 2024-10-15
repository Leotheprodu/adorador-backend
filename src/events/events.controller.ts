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
import { AddSongsToEventDto } from './dto/add-songs-to-event.dto';

@Controller('churches/:churchId/events')
@ApiTags('Events of Church')
@UseGuards(PermissionsGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({ summary: 'Create Service' })
  @CheckLoginStatus('loggedIn')
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
    churchRolesBypass: [
      churchRoles.pastor.id,
      churchRoles.worshipLeader.id,
      churchRoles.youthLeader.id,
      churchRoles.musician.id,
      churchRoles.deacon.id,
    ],
  })
  @Post()
  async create(
    @Body() createEventDto: CreateEventDto,
    @Res() res: Response,
    @Param('churchId', ParseIntPipe) churchId: number,
  ) {
    try {
      const service = await this.eventsService.create(createEventDto, churchId);
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
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
  })
  async findAll(
    @Res() res: Response,
    @Param('churchId', ParseIntPipe) churchId: number,
    @Query('includeAllDates') includeAllDates: string,
  ) {
    try {
      const parsedIncludeAllDates =
        includeAllDates !== undefined && includeAllDates
          ? JSON.parse(includeAllDates)
          : false;
      const events = await this.eventsService.findAll(
        churchId,
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
  @CheckLoginStatus('loggedIn')
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
  })
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('churchId', ParseIntPipe) churchId: number,
  ) {
    try {
      const event = await this.eventsService.findOne(id, churchId);
      if (!event) {
        throw new HttpException('Event not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(event);
    } catch (e) {
      catchHandle(e);
    }
  }
  @CheckLoginStatus('loggedIn')
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
    churchRolesBypass: [
      churchRoles.pastor.id,
      churchRoles.worshipLeader.id,
      churchRoles.youthLeader.id,
      churchRoles.musician.id,
      churchRoles.deacon.id,
    ],
  })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('churchId', ParseIntPipe) churchId: number,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    try {
      const event = await this.eventsService.update(
        id,
        updateEventDto,
        churchId,
      );
      if (!event) {
        throw new HttpException('Event not updated', HttpStatus.BAD_REQUEST);
      }
      res.status(HttpStatus.OK).send(event);
    } catch (e) {
      catchHandle(e);
    }
  }
  @CheckLoginStatus('loggedIn')
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
    churchRolesBypass: [
      churchRoles.pastor.id,
      churchRoles.worshipLeader.id,
      churchRoles.youthLeader.id,
      churchRoles.musician.id,
      churchRoles.deacon.id,
    ],
  })
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('churchId', ParseIntPipe) churchId: number,
  ) {
    try {
      const event = await this.eventsService.remove(id, churchId);
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
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
    churchRolesBypass: [
      churchRoles.pastor.id,
      churchRoles.worshipLeader.id,
      churchRoles.youthLeader.id,
      churchRoles.musician.id,
      churchRoles.deacon.id,
    ],
  })
  async addSongsToEvent(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('churchId', ParseIntPipe) churchId: number,
    @Body() addSongsToEventDto: AddSongsToEventDto,
  ) {
    try {
      /* const songs = this.eventsService.getEventSongs(id); */

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
  @Get(':id/songs')
  @CheckLoginStatus('loggedIn')
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
  })
  async getEventSongs(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Param('churchId', ParseIntPipe) churchId: number,
  ) {
    try {
      const songs = await this.eventsService.getEventSongs(id, churchId);
      if (!songs) {
        throw new HttpException('No songs found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(songs);
    } catch (e) {
      catchHandle(e);
    }
  }
}
