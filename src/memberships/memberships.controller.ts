import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';

@Controller('users/:userId/memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  create(@Body() createMembershipDto: CreateMembershipDto) {
    return this.membershipsService.create(createMembershipDto);
  }

  @Get()
  findAll(@Param('userId', ParseIntPipe) userId: number) {
    return this.membershipsService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.membershipsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    return this.membershipsService.update(id, updateMembershipDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.membershipsService.remove(id);
  }
}
