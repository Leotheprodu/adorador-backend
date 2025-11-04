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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ChurchRolesService } from './church-roles.service';
import { CreateChurchRoleDto } from './dto/create-church-role.dto';
import { UpdateChurchRoleDto } from './dto/update-church-role.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreateChurchRole,
  ApiGetAllChurchRoles,
  ApiGetChurchRole,
  ApiUpdateChurchRole,
  ApiDeleteChurchRole,
} from './church-roles.swagger';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import {
  AppRole,
  CheckLoginStatus,
} from '../auth/decorators/permissions.decorators';
import { Response } from 'express';
import { catchHandle } from '../chore/utils/catchHandle';
import { userRoles } from '../../config/constants';

@Controller('roles/churches')
@ApiTags('Church Roles')
@UseGuards(PermissionsGuard)
export class ChurchRolesController {
  constructor(private readonly churchRolesService: ChurchRolesService) {}

  @ApiCreateChurchRole()
  @CheckLoginStatus('loggedIn')
  @AppRole(userRoles.admin.id)
  @Post()
  async create(
    @Res() res: Response,
    @Body() createChurchRoleDto: CreateChurchRoleDto,
  ) {
    try {
      const churchRole =
        await this.churchRolesService.create(createChurchRoleDto);
      if (!churchRole)
        throw new HttpException('Role Not Created', HttpStatus.CONFLICT);

      res.status(HttpStatus.OK).send(churchRole);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetAllChurchRoles()
  @Get()
  async findAll() {
    return this.churchRolesService.findAll();
  }

  @ApiGetChurchRole()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.churchRolesService.findOne(+id);
  }

  @ApiUpdateChurchRole()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateChurchRoleDto: UpdateChurchRoleDto,
  ) {
    return this.churchRolesService.update(+id, updateChurchRoleDto);
  }

  @ApiDeleteChurchRole()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.churchRolesService.remove(+id);
  }
}
