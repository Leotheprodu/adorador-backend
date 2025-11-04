import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { catchHandle } from '../chore/utils/catchHandle';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreateMembership,
  ApiGetAllMemberships,
  ApiGetMembership,
  ApiUpdateMembership,
  ApiDeleteMembership,
} from './memberships.swagger';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import {
  CheckChurch,
  CheckLoginStatus,
  CheckUserId,
} from '../auth/decorators/permissions.decorators';
import { churchRoles } from '../../config/constants';

@Controller('users/:userId/memberships')
@ApiTags('memberships')
@UseGuards(PermissionsGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @ApiCreateMembership()
  @Post()
  @CheckLoginStatus('loggedIn')
  @CheckUserId('userId')
  @CheckChurch({
    checkBy: 'bodyChurchId',
    key: 'churchId',
    churchRolesBypass: [churchRoles.pastor.id],
  })
  async create(
    @Res() res: Response,
    @Body() createMembershipDto: CreateMembershipDto,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    try {
      const membership = await this.membershipsService.create(
        createMembershipDto,
        userId,
      );
      if (!membership) {
        throw new HttpException(
          'Failed to create membership',
          HttpStatus.BAD_REQUEST,
        );
      }
      res.status(HttpStatus.CREATED).send(membership);
    } catch (e) {
      catchHandle(e);
    }
  }
  @ApiGetAllMemberships()
  @Get()
  async findAll(
    @Res() res: Response,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    try {
      const memberships = await this.membershipsService.findAll(userId);
      if (!memberships)
        throw new HttpException('Memberships not found', HttpStatus.NOT_FOUND);

      res.status(HttpStatus.OK).send(memberships);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetMembership()
  @Get(':id')
  @CheckLoginStatus('loggedIn')
  @CheckUserId('userId')
  @CheckChurch({
    checkBy: 'paramMembershipId',
    key: 'id',
    churchRolesBypass: [churchRoles.pastor.id],
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Res() res: Response,
  ) {
    try {
      const membership = await this.membershipsService.findOne(id);
      if (!membership)
        throw new HttpException('Membership not found', HttpStatus.NOT_FOUND);
      if (membership.userId !== userId)
        throw new HttpException(
          'Membership does not belong to the user',
          HttpStatus.UNAUTHORIZED,
        );

      res.status(HttpStatus.OK).send(membership);
    } catch (e) {
      catchHandle(e);
    }
  }
  @ApiUpdateMembership()
  @Patch(':id')
  @CheckLoginStatus('loggedIn')
  @CheckChurch({
    checkBy: 'paramMembershipId',
    key: 'id',
    churchRolesBypass: [churchRoles.pastor.id],
    churchRoleStrict: true,
  })
  @CheckUserId('userId')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateMembershipDto: UpdateMembershipDto,
  ) {
    try {
      const membership = await this.membershipsService.findOne(id);
      if (!membership)
        throw new HttpException('Membership not found', HttpStatus.NOT_FOUND);
      if (membership.userId !== userId)
        throw new HttpException(
          'Membership does not belong to the user',
          HttpStatus.UNAUTHORIZED,
        );

      return this.membershipsService.update(id, updateMembershipDto);
    } catch (e) {
      catchHandle(e);
    }
  }
  @ApiDeleteMembership()
  @Delete(':id')
  @CheckLoginStatus('loggedIn')
  @CheckChurch({
    checkBy: 'paramMembershipId',
    key: 'id',
    churchRolesBypass: [churchRoles.pastor.id],
    churchRoleStrict: true,
  })
  @CheckUserId('userId')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    try {
      const membership = await this.membershipsService.findOne(id);
      if (!membership)
        throw new HttpException('Membership not found', HttpStatus.NOT_FOUND);
      if (membership.userId !== userId)
        throw new HttpException(
          'Membership does not belong to the user',
          HttpStatus.UNAUTHORIZED,
        );

      return this.membershipsService.remove(id);
    } catch (e) {
      catchHandle(e);
    }
  }
}
