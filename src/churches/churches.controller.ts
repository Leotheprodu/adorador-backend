import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChurchesService } from './churches.service';
import { ApiGetChurches } from './churches.swagger';
import { Response } from 'express';
import { catchHandle } from 'src/chore/utils/catchHandle';

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
}
