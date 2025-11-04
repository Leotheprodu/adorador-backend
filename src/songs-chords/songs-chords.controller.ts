import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Session,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { SongsChordsService } from './songs-chords.service';
import { CreateSongsChordDto } from './dto/create-songs-chord.dto';
import { UpdateSongsChordDto } from './dto/update-songs-chord.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreateChord,
  ApiGetAllChords,
  ApiGetChord,
  ApiUpdateChord,
  ApiDeleteChord,
} from './songs-chords.swagger';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { SongsService } from '../songs/songs.service';
import {
  CheckChurch,
  CheckLoginStatus,
} from '../auth/decorators/permissions.decorators';
import { Response } from 'express';
import { churchRoles } from '../../config/constants';
import { catchHandle } from '../chore/utils/catchHandle';

@Controller('bands/:bandId/songs/:songId/lyrics/:lyricId/chords')
@ApiTags('Songs Chords')
@UseGuards(PermissionsGuard)
@CheckLoginStatus('loggedIn')
/* @CheckChurch({
  checkBy: 'paramBandId',
  key: 'bandId',
  churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
}) */
export class SongsChordsController {
  constructor(
    private readonly songsChordsService: SongsChordsService,
    private readonly songsService: SongsService,
  ) {}

  @ApiCreateChord()
  @Post()
  async create(
    @Body() createSongsChordDto: CreateSongsChordDto,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
    @Param('lyricId', ParseIntPipe) lyricId: number,
  ) {
    try {
      const chords = await this.songsChordsService.findAll(lyricId);
      if (chords.length >= 5) {
        throw new HttpException(
          'Maximum 5 chords allowed',
          HttpStatus.BAD_REQUEST,
        );
      }
      const chordsPosition = chords.map((chord) => chord.position);
      if (chordsPosition.includes(createSongsChordDto.position)) {
        throw new HttpException(
          'Position already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
      const chordCreated = await this.songsChordsService.create(
        createSongsChordDto,
        lyricId,
      );
      if (!chordCreated) {
        throw new HttpException('Chord not created', HttpStatus.BAD_REQUEST);
      }

      res.status(HttpStatus.OK).send(chordCreated);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetAllChords()
  @Get()
  async findAll(
    @Param('bandId', ParseIntPipe) bandId: number,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
    @Param('lyricId', ParseIntPipe) lyricId: number,
  ) {
    try {
      const chords = await this.songsChordsService.findAll(lyricId);
      if (!chords) {
        throw new HttpException('Chords not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(chords);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetChord()
  @Get(':id')
  async findOne(
    @Param('bandId', ParseIntPipe) bandId: number,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
    @Param('lyricId', ParseIntPipe) lyricId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const chord = await this.songsChordsService.findOne(id, lyricId);
      if (!chord) {
        throw new HttpException('Chord not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(chord);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiUpdateChord()
  @Patch(':id')
  async update(
    @Param('bandId', ParseIntPipe) bandId: number,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
    @Param('lyricId', ParseIntPipe) lyricId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongsChordDto: UpdateSongsChordDto,
  ) {
    try {
      const chords = await this.songsChordsService.findAll(lyricId);
      const chordsPosition = chords.map((chord) => chord.position);
      if (chordsPosition.includes(updateSongsChordDto.position)) {
        throw new HttpException(
          'Position already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      const chord = await this.songsChordsService.update(
        id,
        lyricId,
        updateSongsChordDto,
      );
      if (!chord)
        throw new HttpException('Chord not updated', HttpStatus.BAD_REQUEST);
      res.status(HttpStatus.OK).send(chord);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiDeleteChord()
  @Delete(':id')
  async remove(
    @Param('bandId', ParseIntPipe) bandId: number,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
    @Param('lyricId', ParseIntPipe) lyricId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const chord = await this.songsChordsService.remove(id, lyricId);
      if (!chord)
        throw new HttpException('Chord not removed', HttpStatus.BAD_REQUEST);
      res.status(HttpStatus.OK).send({ message: 'Chord removed' });
    } catch (e) {
      catchHandle(e);
    }
  }
}
