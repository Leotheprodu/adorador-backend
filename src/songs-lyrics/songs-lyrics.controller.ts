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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SongsLyricsService } from './songs-lyrics.service';
import { CreateSongsLyricDto } from './dto/create-songs-lyric.dto';
import { UpdateSongsLyricDto } from './dto/update-songs-lyric.dto';
import { ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { Response } from 'express';
import { SessionData } from 'express-session';
import { SongsService } from 'src/songs/songs.service';
import { churchRoles } from 'config/constants';
import { catchHandle } from 'src/chore/utils/catchHandle';
import {
  CheckChurch,
  CheckLoginStatus,
  CheckUserMemberOfBand,
} from 'src/auth/decorators/permissions.decorators';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('bands/:bandId/songs/:songId/lyrics')
@ApiTags('Songs Lyrics')
@UseGuards(PermissionsGuard)
@CheckLoginStatus('loggedIn')
export class SongsLyricsController {
  constructor(
    private readonly songsLyricsService: SongsLyricsService,
    private readonly songsService: SongsService,
  ) {}
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  /* @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
  }) */
  async uploadLyricsWithChordsByFile(
    @UploadedFile() file: Express.Multer.File,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    try {
      console.log('file', file);
      if (!file || !file.buffer) {
        throw new HttpException(
          'File not uploaded or buffer is undefined',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.songsLyricsService.parseAndSaveLyricsWithChords(
        file.buffer,
        songId,
      );
      res.status(HttpStatus.OK).send({ message: 'Lyrics uploaded' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post()
  /* @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
  })  */
  async create(
    @Body() createSongsLyricDto: CreateSongsLyricDto,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    try {
      const lyrics = await this.songsLyricsService.findAll(songId);
      const lyricsPosition = lyrics.map((lyric) => lyric.position);
      if (lyricsPosition.includes(createSongsLyricDto.position)) {
        throw new HttpException(
          'Position already taken',
          HttpStatus.BAD_REQUEST,
        );
      }
      // revisa que la ultima posicion no sea mayor a la cantidad de lyrics
      if (createSongsLyricDto.position > lyrics.length + 1) {
        throw new HttpException(
          'Position must be less than or equal to the number of lyrics',
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
  /* @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
  }) */
  async findAll(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
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
  /* @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
  }) */
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    try {
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
  /* @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
  }) */
  async update(
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Param('songId', ParseIntPipe) songId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSongsLyricDto: UpdateSongsLyricDto,
  ) {
    try {
      const lyrics = await this.songsLyricsService.findAll(songId);
      const lyricsPosition = lyrics.map((lyric) => lyric.position);
      const lyricData = lyrics.find((lyric) => lyric.id === id);
      if (
        lyricsPosition.includes(updateSongsLyricDto.position) &&
        lyricData.id !== id
      ) {
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
      res.status(HttpStatus.OK).send({ message: 'Lyric updated' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch()
  /* @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
  }) */
  async updateArrayOfLyrics(
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Param('songId', ParseIntPipe) songId: number,
    @Body() updateLyricsDto: UpdateSongsLyricDto[],
  ) {
    try {
      const updatedLyrics = await this.songsLyricsService.updateArrayOfLyrics(
        songId,
        updateLyricsDto,
      );
      if (!updatedLyrics) {
        throw new HttpException(
          'Lyrics not updated',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      res.status(HttpStatus.OK).send({ message: 'Lyrics updated' });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Delete(':id')
  /* @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
    isAdmin: true,
  }) */
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Res() res: Response,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    try {
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
