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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import {
  CheckChurch,
  CheckLoginStatus,
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

  @Post()
  @ApiOperation({ summary: 'Create role in membership of user' })
  @CheckLoginStatus('loggedIn')
  @CheckChurch('paramUserId', 'userId')
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

  @Get()
  async findAll() {
    return this.churchMemberRolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.churchMemberRolesService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateChurchMemberRoleDto: UpdateChurchMemberRoleDto,
  ) {
    return this.churchMemberRolesService.update(+id, updateChurchMemberRoleDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.churchMemberRolesService.remove(+id);
  }
}
