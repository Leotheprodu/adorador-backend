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
  ParseIntPipe,
  Session,
  HttpStatus,
} from '@nestjs/common';
import { SongsLyricsService } from './songs-lyrics.service';
import { CreateSongsLyricDto } from './dto/create-songs-lyric.dto';
import { UpdateSongsLyricDto } from './dto/update-songs-lyric.dto';
import { ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { Response } from 'express';
import { checkChurchBySongId } from 'src/songs/utils/checkChurchBySongId';
import { SessionData } from 'express-session';
import { SongsService } from 'src/songs/songs.service';
import { churchRoles } from 'config/constants';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { CheckLoginStatus } from 'src/auth/decorators/permissions.decorators';

@Controller('songs/:songId/lyrics')
@ApiTags('Songs Lyrics')
@UseGuards(PermissionsGuard)
export class SongsLyricsController {
  constructor(
    private readonly songsLyricsService: SongsLyricsService,
    private readonly songsService: SongsService,
  ) {}

  @Post()
  @CheckLoginStatus('loggedIn')
  async create(
    @Body() createSongsLyricDto: CreateSongsLyricDto,
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    try {
      await checkChurchBySongId(session, this.songsService, songId, [
        churchRoles.musician.id,
        churchRoles.worshipLeader.id,
      ]);
      const lyric = await this.songsLyricsService.create(
        createSongsLyricDto,
        songId,
      );
      res.status(HttpStatus.OK).send(lyric);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get()
  @CheckLoginStatus('loggedIn')
  async findAll(
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    try {
      const lyrics = await this.songsLyricsService.findAll(songId);
      res.status(HttpStatus.OK).send(lyrics);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id')
  @CheckLoginStatus('loggedIn')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    try {
      await checkChurchBySongId(session, this.songsService, songId, [
        churchRoles.musician.id,
        churchRoles.worshipLeader.id,
      ]);
      const lyric = await this.songsLyricsService.findOne(id, songId);
      res.status(HttpStatus.OK).send(lyric);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch(':id')
  @CheckLoginStatus('loggedIn')
  async update(
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongsLyricDto: UpdateSongsLyricDto,
  ) {
    try {
      await checkChurchBySongId(session, this.songsService, songId, [
        churchRoles.musician.id,
        churchRoles.worshipLeader.id,
      ]);
      const lyric = await this.songsLyricsService.update(
        id,
        songId,
        updateSongsLyricDto,
      );
      res.status(HttpStatus.OK).send(lyric);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Delete(':id')
  @CheckLoginStatus('loggedIn')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    try {
      await checkChurchBySongId(session, this.songsService, songId, [
        churchRoles.musician.id,
        churchRoles.worshipLeader.id,
      ]);
      await this.songsLyricsService.remove(id, songId);
      res.status(HttpStatus.OK).send({ message: 'Lyric deleted' });
    } catch (e) {
      catchHandle(e);
    }
  }
}
