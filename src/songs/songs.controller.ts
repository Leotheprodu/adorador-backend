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
} from 'src/auth/decorators/permissions.decorators';
import { churchRoles } from 'config/constants';
import { Response } from 'express';
import { catchHandle } from 'src/chore/utils/catchHandle';

@Controller('churches/:churchId/songs')
@ApiTags('Songs')
@UseGuards(PermissionsGuard)
@CheckLoginStatus('loggedIn')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  @ApiOperation({ summary: 'Create Song' })
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  })
  async create(
    @Res() res: Response,
    @Body() createSongDto: CreateSongDto,
    @Param('churchId', ParseIntPipe) churchId: number,
  ) {
    try {
      const song = await this.songsService.create(createSongDto, churchId);
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
    @Param('churchId', ParseIntPipe) churchId: number,
  ) {
    try {
      const songs = await this.songsService.findAll(churchId);
      if (!songs) {
        throw new HttpException('No songs found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(songs);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id')
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
  })
  async findOne(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('churchId', ParseIntPipe) churchId: number,
  ) {
    try {
      const song = await this.songsService.findOne(id, churchId);
      if (!song) {
        throw new HttpException('Song not found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(song);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch(':id')
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  })
  async update(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('churchId', ParseIntPipe) churchId: number,
    @Body() updateSongDto: UpdateSongDto,
  ) {
    try {
      const song = await this.songsService.update(id, updateSongDto, churchId);
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
  @CheckChurch({
    checkBy: 'paramChurchId',
    key: 'churchId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  })
  async remove(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('churchId', ParseIntPipe) churchId: number,
  ) {
    try {
      const song = await this.songsService.remove(id, churchId);
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
