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
  ParseIntPipe,
  HttpException,
} from '@nestjs/common';
import { SongsService } from './songs.service';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreateSong,
  ApiGetSongsByBand,
  ApiGetSong,
  ApiUpdateSong,
  ApiDeleteSong,
} from './songs.swagger';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import {
  CheckChurch,
  CheckLoginStatus,
  CheckUserMemberOfBand,
} from '../auth/decorators/permissions.decorators';
import { CheckSubscriptionLimit, SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { churchRoles } from '../../config/constants';
import { Response } from 'express';
import { catchHandle } from '../chore/utils/catchHandle';

@Controller('bands/:bandId/songs')
@ApiTags('Songs')
@UseGuards(PermissionsGuard, SubscriptionGuard)
@CheckLoginStatus('loggedIn')
export class SongsController {
  constructor(private readonly songsService: SongsService) { }

  @ApiCreateSong()
  @Post()
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
    isAdmin: true,
  })
  @CheckSubscriptionLimit('maxSongs')
  async create(
    @Res() res: Response,
    @Body() createSongDto: CreateSongDto,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const song = await this.songsService.create(createSongDto, bandId);
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

  @ApiGetSongsByBand()
  @Get()
  @CheckLoginStatus('public')
  async findAll(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const songs = await this.songsService.findAll(bandId);
      if (!songs) {
        throw new HttpException('No songs found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(songs);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetSong()
  @CheckLoginStatus('public')
  @Get(':id')
  async findOne(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const song = await this.songsService.findOne(id, bandId);
      if (!song) {
        throw new HttpException('Song not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(song);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiUpdateSong()
  @Patch(':id')
  @CheckLoginStatus('loggedIn')
 @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
  })
  async update(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Body() updateSongDto: UpdateSongDto,
  ) {
    try {
      const song = await this.songsService.update(id, updateSongDto, bandId);
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

  @ApiDeleteSong()
  @Delete(':id')
  @CheckLoginStatus('loggedIn')
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
    isAdmin: true,
  })
  async remove(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const song = await this.songsService.remove(id, bandId);
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
