import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BandsService } from './bands.service';
import { Response } from 'express';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import {
  AppRole,
  CheckLoginStatus,
} from 'src/auth/decorators/permissions.decorators';
import { userRoles } from 'config/constants';
import { CreateBandDto } from './dto/create-band.dto';
import { ApiGetBands } from './bands.swagger';
import { SessionData } from 'express-session';

@Controller('bands')
@ApiTags('bands')
@UseGuards(PermissionsGuard)
export class BandsController {
  constructor(private bandsService: BandsService) {}

  @ApiGetBands()
  @Get()
  async getBands(@Res() res: Response) {
    try {
      const bandsData = await this.bandsService.getBands();
      if (!bandsData)
        throw new HttpException('Users not found', HttpStatus.NOT_FOUND);

      res.send(bandsData);
    } catch (e) {
      catchHandle(e);
    }
  }
  @Get('user-bands')
  async getBandsByUserId(
    @Session() session: SessionData,
    @Res() res: Response,
  ) {
    try {
      const userId = session.userId;
      if (!session.isLoggedIn) {
        throw new HttpException('User not logged in', HttpStatus.UNAUTHORIZED);
      }
      const bandsData = await this.bandsService.getBandsByUserId(userId);
      if (!bandsData)
        throw new HttpException('Users not found', HttpStatus.NOT_FOUND);

      res.send(bandsData);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post()
  @CheckLoginStatus('loggedIn')
  @AppRole(userRoles.admin.id)
  async createBand(@Res() res: Response, @Body() body: CreateBandDto) {
    try {
      const bandData = await this.bandsService.createBand(body);
      if (!bandData)
        throw new HttpException('Users not found', HttpStatus.NOT_FOUND);

      res.send(bandData);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id')
  @CheckLoginStatus('loggedIn')
  async getBand(@Res() res: Response, @Param('id', ParseIntPipe) id: number) {
    try {
      const bandData = await this.bandsService.getBand(id);
      if (!bandData)
        throw new HttpException('Band not found', HttpStatus.NOT_FOUND);

      res.send(bandData);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch(':id')
  @CheckLoginStatus('loggedIn')
  @AppRole(userRoles.admin.id)
  async updateBand(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateBandDto,
  ) {
    try {
      const bandData = await this.bandsService.updateBand(id, body);
      if (!bandData)
        throw new HttpException('Band not found', HttpStatus.NOT_FOUND);

      res.send(bandData);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Delete(':id')
  @CheckLoginStatus('loggedIn')
  @AppRole(userRoles.admin.id)
  async deleteBand(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      await this.bandsService.deleteBand(id);
      res.send({ message: `Band id ${id} deleted` });
    } catch (e) {
      catchHandle(e);
    }
  }
}
