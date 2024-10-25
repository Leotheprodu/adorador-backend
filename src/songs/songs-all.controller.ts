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
  Query,
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

@Controller('songs')
@ApiTags('Songs')
@UseGuards(PermissionsGuard)
@CheckLoginStatus('loggedIn')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get()
  async findAllSongs(
    @Res() res: Response,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    try {
      const songs = await this.songsService.findAllSongs(page, limit);
      if (!songs) {
        throw new HttpException('No songs found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(songs);
    } catch (e) {
      catchHandle(e);
    }
  }
}
