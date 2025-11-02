import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ChurchMemberRolesService } from './church-member-roles.service';
import { CreateChurchMemberRoleDto } from './dto/create-church-member-role.dto';
import { UpdateChurchMemberRoleDto } from './dto/update-church-member-role.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreateMembershipRole,
  ApiGetAllMembershipRoles,
  ApiGetMembershipRole,
  ApiUpdateMembershipRole,
  ApiDeleteMembershipRole,
} from './church-member-roles.swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import {
  CheckChurch,
  CheckLoginStatus,
  CheckUserId,
} from 'src/auth/decorators/permissions.decorators';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { Response } from 'express';

@Controller('users/:userId/memberships/:membershipId/roles')
@ApiTags('Membership Roles by User')
@UseGuards(PermissionsGuard)
export class ChurchMemberRolesController {
  constructor(
    private readonly churchMemberRolesService: ChurchMemberRolesService,
  ) {}

  @ApiCreateMembershipRole()
  @Post()
  @CheckLoginStatus('loggedIn')
  @CheckChurch({ checkBy: 'paramMembershipId', key: 'membershipId' })
  async create(
    @Body() createChurchMemberRoleDto: CreateChurchMemberRoleDto,
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @Res() res: Response,
  ) {
    try {
      const membershipRole = await this.churchMemberRolesService.create(
        createChurchMemberRoleDto,
        membershipId,
      );
      if (!membershipRole) {
        throw new HttpException('Role Not Created', HttpStatus.CONFLICT);
      }
      res.status(HttpStatus.OK).send(membershipRole);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetAllMembershipRoles()
  @Get()
  @CheckLoginStatus('loggedIn')
  @CheckChurch({ checkBy: 'paramMembershipId', key: 'membershipId' })
  @CheckUserId('userId')
  async findAll(
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @Res() res: Response,
  ) {
    try {
      const churchMemberRoles =
        await this.churchMemberRolesService.findAll(membershipId);
      if (!churchMemberRoles) {
        throw new HttpException('Roles Not Found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(churchMemberRoles);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetMembershipRole()
  @Get(':id')
  @CheckLoginStatus('loggedIn')
  @CheckChurch({ checkBy: 'paramMembershipId', key: 'membershipId' })
  @CheckUserId('userId')
  async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const churchMemberRole = await this.churchMemberRolesService.findOne(id);
      if (!churchMemberRole) {
        throw new HttpException('Role Not Found', HttpStatus.NOT_FOUND);
      }
      res.status(HttpStatus.OK).send(churchMemberRole);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiUpdateMembershipRole()
  @Patch(':id')
  @CheckLoginStatus('loggedIn')
  @CheckChurch({ checkBy: 'paramMembershipId', key: 'membershipId' })
  @CheckUserId('userId')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChurchMemberRoleDto: UpdateChurchMemberRoleDto,
    @Res() res: Response,
  ) {
    try {
      const churchMemberRole = await this.churchMemberRolesService.update(
        id,
        updateChurchMemberRoleDto,
      );
      if (!churchMemberRole) {
        throw new HttpException('Role Not Updated', HttpStatus.CONFLICT);
      }
      res.status(HttpStatus.OK).send(churchMemberRole);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiDeleteMembershipRole()
  @Delete(':id')
  @CheckLoginStatus('loggedIn')
  @CheckChurch({ checkBy: 'paramMembershipId', key: 'membershipId' })
  @CheckUserId('userId')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const churchMemberRole = await this.churchMemberRolesService.remove(id);
      if (!churchMemberRole) {
        throw new HttpException('Role Not Deleted', HttpStatus.CONFLICT);
      }
      res.status(HttpStatus.OK).send(churchMemberRole);
    } catch (e) {
      catchHandle(e);
    }
  }
}
