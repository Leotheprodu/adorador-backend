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
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChurchesService } from './churches.service';
import { ApiGetChurches } from './churches.swagger';
import { Response } from 'express';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { IsNotLoggedInGuard } from 'src/auth/guards/is-not-logged-in/is-not-logged-in.guard';
import { UserStatusGuard } from 'src/users/guards/user-status/user-status.guard';
import { CreateChurchDto } from './dto/create-church.dto';

@Controller('churches')
@ApiTags('churches')
export class ChurchesController {
  constructor(private churchesService: ChurchesService) {}

  @ApiGetChurches()
  @Get()
  async getChurhes(@Res() res: Response) {
    try {
      const churchesData = await this.churchesService.getChurches();
      if (!churchesData)
        throw new HttpException('Users not found', HttpStatus.NOT_FOUND);

      res.send(churchesData);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post()
  @UseGuards(IsNotLoggedInGuard)
  @UseGuards(UserStatusGuard)
  async createChurch(@Res() res: Response, @Body() body: CreateChurchDto) {
    try {
      const churchData = await this.churchesService.createChurch(body);
      if (!churchData)
        throw new HttpException('Users not found', HttpStatus.NOT_FOUND);

      res.send(churchData);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get(':id')
  @UseGuards(IsNotLoggedInGuard)
  async getChurch(@Res() res: Response, @Param('id', ParseIntPipe) id: number) {
    try {
      const churchData = await this.churchesService.getChurch(id);
      if (!churchData)
        throw new HttpException('Church not found', HttpStatus.NOT_FOUND);

      res.send(churchData);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch(':id')
  @UseGuards(IsNotLoggedInGuard)
  @UseGuards(UserStatusGuard)
  async updateChurch(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateChurchDto,
  ) {
    try {
      const churchData = await this.churchesService.updateChurch(id, body);
      if (!churchData)
        throw new HttpException('Church not found', HttpStatus.NOT_FOUND);

      res.send(churchData);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Delete(':id')
  @UseGuards(IsNotLoggedInGuard)
  @UseGuards(UserStatusGuard)
  async deleteChurch(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      await this.churchesService.deleteChurch(id);
      res.send({ message: `Church id ${id} deleted` });
    } catch (e) {
      catchHandle(e);
    }
  }
}
