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
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BandsService } from './bands.service';
import { Response } from 'express';
import { catchHandle } from '../chore/utils/catchHandle';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import {
  AppRole,
  CheckLoginStatus,
  CheckUserMemberOfBand,
} from '../auth/decorators/permissions.decorators';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtPayload, AuthJwtService } from '../auth/services/jwt.service';
import { userRoles } from '../../config/constants';
import { CreateBandDto } from './dto/create-band.dto';
import { DeleteBandDto } from './dto/delete-band.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import {
  ApiGetBands,
  ApiGetUserBands,
  ApiCreateBand,
  ApiGetBand,
  ApiUpdateBand,
  ApiDeleteBand,
} from './bands.swagger';

@Controller('bands')
@ApiTags('bands')
@UseGuards(PermissionsGuard)
export class BandsController {
  constructor(
    private bandsService: BandsService,
    private authJwtService: AuthJwtService,
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

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
  @ApiGetUserBands()
  @Get('user-bands')
  @CheckLoginStatus('loggedIn')
  async getBandsByUserId(@GetUser() user: JwtPayload, @Res() res: Response) {
    try {
      const userId = user.sub;
      const bandsData = await this.bandsService.getBandsByUserId(userId);
      if (!bandsData)
        throw new HttpException('Bands not found', HttpStatus.NOT_FOUND);

      res.send(bandsData);
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiCreateBand()
  @Post()
  @CheckLoginStatus('loggedIn')
  async createBand(
    @Res() res: Response,
    @Body() body: CreateBandDto,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const bandData = await this.bandsService.createBand(body, user.sub);
      if (!bandData)
        throw new HttpException('Band not created', HttpStatus.BAD_REQUEST);

      // Obtener los datos actualizados del usuario con la nueva membresía
      const updatedUser: any = await this.prisma.users.findUnique({
        where: { id: user.sub },
        include: {
          roles: true,
          memberships: {
            include: {
              church: true,
              roles: { include: { role: true } },
            },
          },
          membersofBands: {
            include: {
              band: true,
            },
          },
        },
      });

      // Formatear los datos para el JWT
      const userRoles = updatedUser.roles.map((r) => r.id);

      const userMemberships = updatedUser.memberships.map((membership) => {
        return {
          id: membership.id,
          church: {
            id: membership.church.id,
            name: membership.church.name,
          },
          roles: membership.roles.map((role) => {
            return {
              id: role.id,
              name: role.role.name,
              churchRoleId: role.role.id,
            };
          }),
          since: membership.memberSince,
        };
      });

      const userBandMemberships = updatedUser.membersofBands.map(
        (bandMember) => {
          return {
            id: bandMember.id,
            role: bandMember.role,
            isAdmin: bandMember.isAdmin,
            isEventManager: bandMember.isEventManager,
            band: {
              id: bandMember.band.id,
              name: bandMember.band.name,
            },
          };
        },
      );

      // Generar nuevos tokens con los datos actualizados
      const tokens = this.authJwtService.generateTokens(
        updatedUser.id,
        updatedUser.email || updatedUser.phone, // Usar email si existe, sino phone
        updatedUser.name,
        userRoles,
        userMemberships,
        userBandMemberships,
      );

      // Guardar refresh token en base de datos
      await this.prisma.users.update({
        where: { id: updatedUser.id },
        data: { refreshToken: tokens.refreshToken },
      });

      res.send({
        band: bandData,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (e) {
      catchHandle(e);
    }
  }

  @ApiGetBand()
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

  @ApiUpdateBand()
  @Patch(':id')
  @CheckLoginStatus('loggedIn')
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'id',
    isAdmin: true,
  })
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

  @ApiDeleteBand()
  @Delete(':id')
  @CheckLoginStatus('loggedIn')
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'id',
    isAdmin: true,
  })
  async deleteBand(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: DeleteBandDto,
    @GetUser() user: JwtPayload,
  ) {
    try {
      // Validar que la confirmación sea correcta
      const confirmationText = 'estoy seguro que esto es irreversible';
      if (body.confirmation.toLowerCase() !== confirmationText) {
        throw new HttpException(
          'Confirmation text does not match',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar la contraseña del usuario
      const isPasswordValid = await this.bandsService.validateUserPassword(
        user.sub,
        body.password,
      );

      if (!isPasswordValid) {
        throw new HttpException('Invalid password', HttpStatus.BAD_REQUEST);
      }

      // Si todo es válido, eliminar el grupo
      await this.bandsService.deleteBand(id);
      res.send({ message: `Band id ${id} deleted successfully` });
    } catch (e) {
      catchHandle(e);
    }
  }

  // ============ ENDPOINTS DE INVITACIONES ============

  @Get(':bandId/search-users')
  @CheckLoginStatus('loggedIn')
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
    isAdmin: true,
  })
  async searchUsersToInvite(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Query('q') query: string,
  ) {
    try {
      if (!query || query.trim().length < 2) {
        throw new HttpException(
          'Query must be at least 2 characters',
          HttpStatus.BAD_REQUEST,
        );
      }

      const users = await this.bandsService.searchUsersToInvite(query, bandId);
      res.send(users);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post(':bandId/invite')
  @CheckLoginStatus('loggedIn')
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
    isAdmin: true,
  })
  async createInvitation(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Body() body: CreateInvitationDto,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const invitation = await this.bandsService.createInvitation(
        bandId,
        body.invitedUserId,
        user.sub,
      );

      // Emitir evento WebSocket al usuario invitado
      this.eventsGateway.server.emit('BAND_INVITATION_RECEIVED', {
        invitationId: invitation.id,
        bandId: invitation.bandId,
        bandName: invitation.band.name,
        inviterId: invitation.invitedBy,
        inviterName: invitation.inviter.name,
        invitedUserId: invitation.invitedUserId,
        expiresAt: invitation.expiresAt,
      });

      res.send(invitation);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Get('invitations/pending')
  @CheckLoginStatus('loggedIn')
  async getMyPendingInvitations(
    @Res() res: Response,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const invitations = await this.bandsService.getPendingInvitations(
        user.sub,
      );
      res.send(invitations);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post('invitations/:id/accept')
  @CheckLoginStatus('loggedIn')
  async acceptInvitation(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    try {
      const result = await this.bandsService.acceptInvitation(id, user.sub);

      // Obtener los datos actualizados del usuario con la nueva membresía
      const updatedUser: any = await this.prisma.users.findUnique({
        where: { id: user.sub },
        include: {
          roles: true,
          memberships: {
            include: {
              church: true,
              roles: { include: { role: true } },
            },
          },
          membersofBands: {
            include: {
              band: true,
            },
          },
        },
      });

      // Formatear los datos para el JWT
      const userRoles = updatedUser.roles.map((r) => r.id);

      const userMemberships = updatedUser.memberships.map((membership) => {
        return {
          id: membership.id,
          church: {
            id: membership.church.id,
            name: membership.church.name,
          },
          roles: membership.roles.map((role) => {
            return {
              id: role.id,
              name: role.role.name,
              churchRoleId: role.role.id,
            };
          }),
          since: membership.memberSince,
        };
      });

      const userBandMemberships = updatedUser.membersofBands.map(
        (bandMember) => {
          return {
            id: bandMember.id,
            role: bandMember.role,
            isAdmin: bandMember.isAdmin,
            isEventManager: bandMember.isEventManager,
            band: {
              id: bandMember.band.id,
              name: bandMember.band.name,
            },
          };
        },
      );

      // Generar nuevos tokens con los datos actualizados
      const tokens = this.authJwtService.generateTokens(
        updatedUser.id,
        updatedUser.email || updatedUser.phone,
        updatedUser.name,
        userRoles,
        userMemberships,
        userBandMemberships,
      );

      // Guardar refresh token en base de datos
      await this.prisma.users.update({
        where: { id: updatedUser.id },
        data: { refreshToken: tokens.refreshToken },
      });

      // Emitir evento al invitador
      this.eventsGateway.server.emit('BAND_INVITATION_ACCEPTED', {
        invitationId: id,
        bandId: result.invitation.bandId,
        userId: user.sub,
        userName: user.name,
        inviterId: result.invitation.invitedBy,
      });

      // Emitir evento a todos los miembros de la banda
      this.eventsGateway.server.emit('BAND_MEMBER_ADDED', {
        bandId: result.invitation.bandId,
        member: result.membership,
      });

      res.send({
        membership: result.membership,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (e) {
      catchHandle(e);
    }
  }

  @Post('invitations/:id/reject')
  @CheckLoginStatus('loggedIn')
  async rejectInvitation(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    try {
      // Obtener invitación para emitir evento
      const invitation = await this.prisma.bandInvitations.findUnique({
        where: { id },
      });

      const result = await this.bandsService.rejectInvitation(id, user.sub);

      // Emitir evento al invitador
      if (invitation) {
        this.eventsGateway.server.emit('BAND_INVITATION_REJECTED', {
          invitationId: id,
          bandId: invitation.bandId,
          userId: user.sub,
          userName: user.name,
          inviterId: invitation.invitedBy,
        });
      }

      res.send(result);
    } catch (e) {
      catchHandle(e);
    }
  }

  // ============ ENDPOINTS DE MIEMBROS ============

  @Get(':bandId/members')
  @CheckLoginStatus('loggedIn')
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
  })
  async getBandMembers(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
  ) {
    try {
      const members = await this.bandsService.getBandMembers(bandId);
      res.send(members);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Patch(':bandId/members/:userId')
  @CheckLoginStatus('loggedIn')
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
    isAdmin: true,
  })
  async updateMemberRole(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: UpdateMemberDto,
  ) {
    try {
      const member = await this.bandsService.updateMemberRole(
        bandId,
        userId,
        body,
      );

      // Emitir evento de actualización de miembro
      this.eventsGateway.server.emit('BAND_MEMBER_UPDATED', {
        bandId,
        userId,
        changes: body,
      });

      res.send(member);
    } catch (e) {
      catchHandle(e);
    }
  }

  @Delete(':bandId/members/:userId')
  @CheckLoginStatus('loggedIn')
  @CheckUserMemberOfBand({
    checkBy: 'paramBandId',
    key: 'bandId',
    isAdmin: true,
  })
  async removeMember(
    @Res() res: Response,
    @Param('bandId', ParseIntPipe) bandId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    try {
      const result = await this.bandsService.removeMember(bandId, userId);

      // Obtener los datos actualizados del usuario removido
      const updatedUser: any = await this.prisma.users.findUnique({
        where: { id: userId },
        include: {
          roles: true,
          memberships: {
            include: {
              church: true,
              roles: { include: { role: true } },
            },
          },
          membersofBands: {
            include: {
              band: true,
            },
          },
        },
      });

      // Formatear los datos para el JWT
      const userRoles = updatedUser.roles.map((r) => r.id);

      const userMemberships = updatedUser.memberships.map((membership) => {
        return {
          id: membership.id,
          church: {
            id: membership.church.id,
            name: membership.church.name,
          },
          roles: membership.roles.map((role) => {
            return {
              id: role.id,
              name: role.role.name,
              churchRoleId: role.role.id,
            };
          }),
          since: membership.memberSince,
        };
      });

      const userBandMemberships = updatedUser.membersofBands.map(
        (bandMember) => {
          return {
            id: bandMember.id,
            role: bandMember.role,
            isAdmin: bandMember.isAdmin,
            isEventManager: bandMember.isEventManager,
            band: {
              id: bandMember.band.id,
              name: bandMember.band.name,
            },
          };
        },
      );

      // Generar nuevos tokens con los datos actualizados (sin la banda)
      const tokens = this.authJwtService.generateTokens(
        updatedUser.id,
        updatedUser.email || updatedUser.phone,
        updatedUser.name,
        userRoles,
        userMemberships,
        userBandMemberships,
      );

      // Guardar refresh token en base de datos
      await this.prisma.users.update({
        where: { id: updatedUser.id },
        data: { refreshToken: tokens.refreshToken },
      });

      // Emitir evento de eliminación de miembro con tokens actualizados
      this.eventsGateway.server.emit('BAND_MEMBER_REMOVED', {
        bandId,
        userId,
        removedMember: result.removedMember,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });

      res.send(result);
    } catch (e) {
      catchHandle(e);
    }
  }
}
