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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import {
  CheckChurch,
  CheckLoginStatus,
  CheckUserMemberOfBand,
} from 'src/auth/decorators/permissions.decorators';
import { churchRoles } from 'config/constants';
import { Response } from 'express';
import { catchHandle } from 'src/chore/utils/catchHandle';

@Controller('bands/:bandId/songs')
@ApiTags('Songs')
@UseGuards(PermissionsGuard)
@CheckLoginStatus('loggedIn')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  @ApiOperation({ summary: 'Create Song' })
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
  })
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

  @Get()
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

  @Get(':id')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
  }) */
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

  @Patch(':id')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  }) */
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

  @Delete(':id')
  /* @CheckChurch({
    checkBy: 'paramBandId',
    key: 'bandId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  }) */
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
