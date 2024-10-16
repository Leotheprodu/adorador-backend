import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  HttpStatus,
  Session,
  ParseIntPipe,
  HttpException,
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import {
  CheckChurch,
  CheckLoginStatus,
} from 'src/auth/decorators/permissions.decorators';
import { churchRoles } from 'config/constants';
import { Response } from 'express';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { SessionData } from 'express-session';
import { checkChurchBySongId } from './utils/checkChurchBySongId';

@Controller('songs')
@ApiTags('Songs')
@UseGuards(PermissionsGuard)
@CheckLoginStatus('loggedIn')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  @ApiOperation({ summary: 'Create Song' })
  @CheckChurch({
    checkBy: 'bodyChurchId',
    key: 'churchId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  })
  async create(@Res() res: Response, @Body() createSongDto: CreateSongDto) {
    try {
      const song = await this.songsService.create(createSongDto);
      if (!song) {
        throw new HttpException(
          'Failed to create song',
          HttpStatus.BAD_REQUEST,
        );
      }
      res.status(HttpStatus.CREATED).send(song);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const songs = await this.songsService.findAll();
      if (!songs) {
        throw new HttpException('No songs found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(songs);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id')
  async findOne(@Res() res: Response, @Param('id', ParseIntPipe) id: number) {
    try {
      const song = await this.songsService.findOne(id);
      if (!song) {
        throw new HttpException('Song not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(song);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch(':id')
  async update(
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongDto: UpdateSongDto,
  ) {
    try {
      await checkChurchBySongId(session, this.songsService, id, [
        churchRoles.musician.id,
        churchRoles.worshipLeader.id,
      ]);
      const song = await this.songsService.update(id, updateSongDto);
      if (!song) {
        throw new HttpException(
          'Failed to update song',
          HttpStatus.BAD_REQUEST,
        );
      }
      res.status(HttpStatus.OK).send(song);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Delete(':id')
  async remove(
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      await checkChurchBySongId(session, this.songsService, id, [
        churchRoles.musician.id,
        churchRoles.worshipLeader.id,
      ]);
      const song = await this.songsService.remove(id);
      if (!song) {
        throw new HttpException(
          'Failed to delete song',
          HttpStatus.BAD_REQUEST,
        );
      }
      res.status(HttpStatus.OK).send(song);
    } catch (e) {
      catchHandle(e);
    }
  }
}
