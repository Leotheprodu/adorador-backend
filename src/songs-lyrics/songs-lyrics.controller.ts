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
  HttpException,
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
@CheckLoginStatus('loggedIn')
export class SongsLyricsController {
  constructor(
    private readonly songsLyricsService: SongsLyricsService,
    private readonly songsService: SongsService,
  ) {}

  @Post()
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

      const lyrics = await this.songsLyricsService.findAll(songId);
      const lyricsPosition = lyrics.map((lyric) => lyric.position);
      if (lyricsPosition.includes(createSongsLyricDto.position)) {
        throw new HttpException(
          'Position already taken',
          HttpStatus.BAD_REQUEST,
        );
      }

      const lyric = await this.songsLyricsService.create(
        createSongsLyricDto,
        songId,
      );
      if (!lyric) {
        throw new HttpException(
          'Lyric not created',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      res.status(HttpStatus.OK).send(lyric);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get()
  async findAll(
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    try {
      const lyrics = await this.songsLyricsService.findAll(songId);
      if (!lyrics) {
        throw new HttpException('Lyrics not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(lyrics);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id')
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
      if (!lyric) {
        throw new HttpException('Lyric not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(lyric);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch(':id')
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
      const lyrics = await this.songsLyricsService.findAll(songId);
      const lyricsPosition = lyrics.map((lyric) => lyric.position);
      if (lyricsPosition.includes(updateSongsLyricDto.position)) {
        throw new HttpException(
          'Position already taken',
          HttpStatus.BAD_REQUEST,
        );
      }
      const lyric = await this.songsLyricsService.update(
        id,
        songId,
        updateSongsLyricDto,
      );
      if (!lyric) {
        throw new HttpException(
          'Lyric not updated',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      res.status(HttpStatus.OK).send(lyric);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Delete(':id')
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
      const lyric = await this.songsLyricsService.remove(id, songId);
      if (!lyric) {
        throw new HttpException(
          'Lyric not deleted',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      res.status(HttpStatus.OK).send({ message: 'Lyric deleted' });
    } catch (e) {
      catchHandle(e);
    }
  }
}
