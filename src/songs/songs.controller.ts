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

@Controller('songs')
@ApiTags('Songs')
@UseGuards(PermissionsGuard)
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  @ApiOperation({ summary: 'Create Song' })
  @CheckLoginStatus('loggedIn')
  @CheckChurch({
    checkBy: 'bodyChurchId',
    key: 'churchId',
    churchRolesBypass: [churchRoles.worshipLeader.id, churchRoles.musician.id],
  })
  async create(@Res() res: Response, @Body() createSongDto: CreateSongDto) {
    try {
      const membership = await this.songsService.create(createSongDto);
      res.status(HttpStatus.CREATED).send(membership);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get()
  async findAll(@Res() res: Response) {
    try {
      const songs = await this.songsService.findAll();
      res.status(HttpStatus.OK).send(songs);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id')
  async findOne(
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    return this.songsService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() updateSongDto: UpdateSongDto,
  ) {
    return this.songsService.update(+id, updateSongDto);
  }

  @Delete(':id')
  async remove(
    @Session() session: SessionData,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    return this.songsService.remove(+id);
  }
}
