import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBandDto } from './dto/create-band.dto';
import { passwordCompare } from '../users/utils/handlePassword';
import { UpdateMemberDto } from './dto/update-member.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class BandsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway))
    private readonly eventsGateway: EventsGateway,
  ) { }

  async getBands() {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return await this.prisma.bands.findMany({
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async getBandsByUserId(userId: number) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return await this.prisma.bands.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        events: {
          where: {
            date: {
              gt: currentDate,
            },
          },
          orderBy: {
            date: 'asc',
          },
          omit: {
            createdAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            members: true,
            events: true,
            songs: true,
          },
        },
      },
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createBand(data: CreateBandDto, userId: number) {
    // Crear el band y automáticamente agregar al usuario como miembro admin y event manager
    const band = await this.prisma.bands.create({
      data: {
        ...data,
        createdBy: userId, // Track band creator for subscription limits
        members: {
          create: {
            userId,
            role: 'Líder/Admin', // Rol del creador del grupo
            active: true,
            isAdmin: true, // El creador es admin
            isEventManager: true, // El creador es manager de eventos
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (band) {
      return band;
    }
  }
  async getBand(id: number) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    return await this.prisma.bands.findUnique({
      where: { id },
      omit: {
        createdAt: true,
        updatedAt: true,
      },
      include: {
        _count: {
          select: {
            events: true,
            songs: true,
          },
        },
        songs: {
          orderBy: {
            events: {
              _count: 'desc',
            },
          },
          take: 5,
          omit: {
            createdAt: true,
            updatedAt: true,
          },
        },
        events: {
          orderBy: {
            date: 'desc',
          },
          take: 5,
          omit: {
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }
  async updateBand(id: number, data: CreateBandDto) {
    return await this.prisma.bands.update({
      where: { id },
      data,
    });
  }
  async deleteBand(id: number) {
    // Eliminar en cascada todas las relaciones del grupo
    return await this.prisma.$transaction(async (prisma) => {
      // 1. Obtener todas las canciones del grupo para eliminar sus letras y acordes
      const songs = await prisma.songs.findMany({
        where: { bandId: id },
        include: { lyrics: { include: { chords: true } } },
      });

      // 2. Eliminar acordes de las letras
      for (const song of songs) {
        for (const lyric of song.lyrics) {
          await prisma.songs_Chords.deleteMany({
            where: { lyricId: lyric.id },
          });
        }
      }

      // 3. Eliminar letras de canciones
      await prisma.songs_lyrics.deleteMany({
        where: { songId: { in: songs.map((s) => s.id) } },
      });

      // 4. Eliminar relaciones de canciones con eventos (SongsEvents se elimina en cascada por onDelete: Cascade)
      // No necesita acción manual

      // 5. Eliminar canciones del grupo
      await prisma.songs.deleteMany({
        where: { bandId: id },
      });

      // 6. Eliminar eventos del grupo (SongsEvents se elimina en cascada)
      await prisma.events.deleteMany({
        where: { bandId: id },
      });

      // 7. Eliminar membresías del grupo
      await prisma.membersofBands.deleteMany({
        where: { bandId: id },
      });

      // 8. Finalmente eliminar el grupo
      return await prisma.bands.delete({
        where: { id },
      });
    });
  }

  async validateUserPassword(
    userId: number,
    password: string,
  ): Promise<boolean> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return false;
    }

    return await passwordCompare(password, user.password);
  }

  // ============ INVITACIONES ============

  async searchUsersToInvite(query: string, bandId: number) {
    // Buscar usuarios por nombre, email o teléfono
    const users = await this.prisma.users.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ],
        // Excluir usuarios que ya son miembros
        membersofBands: {
          none: {
            bandId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      take: 10,
    });

    // Verificar si tienen invitaciones pendientes
    const usersWithInvitationStatus = await Promise.all(
      users.map(async (user) => {
        const pendingInvitation = await this.prisma.bandInvitations.findFirst({
          where: {
            bandId,
            invitedUserId: user.id,
            status: 'pending',
          },
        });

        return {
          ...user,
          hasPendingInvitation: !!pendingInvitation,
        };
      }),
    );

    return usersWithInvitationStatus;
  }

  async createInvitation(
    bandId: number,
    invitedUserId: number,
    inviterId: number,
  ) {
    // Verificar que el usuario no sea ya miembro
    const existingMember = await this.prisma.membersofBands.findFirst({
      where: {
        bandId,
        userId: invitedUserId,
      },
    });

    if (existingMember) {
      throw new BadRequestException('El usuario ya es miembro de la banda');
    }

    // Verificar que no tenga invitación pendiente
    const pendingInvitation = await this.prisma.bandInvitations.findFirst({
      where: {
        bandId,
        invitedUserId,
        status: 'pending',
      },
    });

    if (pendingInvitation) {
      throw new BadRequestException(
        'El usuario ya tiene una invitación pendiente',
      );
    }

    // Verificar límite de invitaciones pendientes del usuario
    const userPendingInvitations = await this.prisma.bandInvitations.count({
      where: {
        invitedUserId,
        status: 'pending',
      },
    });

    if (userPendingInvitations >= 5) {
      throw new BadRequestException(
        'El usuario ha alcanzado el límite de invitaciones pendientes',
      );
    }

    // Crear invitación con expiración de 30 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invitation = await this.prisma.bandInvitations.create({
      data: {
        bandId,
        invitedUserId,
        invitedBy: inviterId,
        expiresAt,
      },
      include: {
        band: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return invitation;
  }

  async getPendingInvitations(userId: number) {
    return await this.prisma.bandInvitations.findMany({
      where: {
        invitedUserId: userId,
        status: 'pending',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        band: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async acceptInvitation(invitationId: number, userId: number) {
    const invitation = await this.prisma.bandInvitations.findUnique({
      where: { id: invitationId },
      include: {
        band: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.invitedUserId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para aceptar esta invitación',
      );
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Esta invitación ya fue procesada');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.bandInvitations.update({
        where: { id: invitationId },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Esta invitación ha expirado');
    }

    // Verificar que el usuario no sea ya miembro de la banda
    const existingMembership = await this.prisma.membersofBands.findFirst({
      where: {
        userId,
        bandId: invitation.bandId,
      },
    });

    if (existingMembership) {
      throw new BadRequestException('Ya eres miembro de este grupo');
    }

    // Crear membresía y actualizar invitación en transacción
    const result = await this.prisma.$transaction(async (prisma) => {
      // Crear membresía
      const membership = await prisma.membersofBands.create({
        data: {
          userId,
          bandId: invitation.bandId,
          role: 'Miembro',
          active: true,
          isAdmin: false,
          isEventManager: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          band: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Actualizar invitación
      await prisma.bandInvitations.update({
        where: { id: invitationId },
        data: { status: 'accepted' },
      });

      return { membership, invitation };
    });

    return result;
  }

  async rejectInvitation(invitationId: number, userId: number) {
    const invitation = await this.prisma.bandInvitations.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitation.invitedUserId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para rechazar esta invitación',
      );
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestException('Esta invitación ya fue procesada');
    }

    await this.prisma.bandInvitations.update({
      where: { id: invitationId },
      data: { status: 'rejected' },
    });

    return { message: 'Invitación rechazada exitosamente' };
  }

  // ============ MIEMBROS ============

  async getBandMembers(bandId: number) {
    return await this.prisma.membersofBands.findMany({
      where: { bandId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { isAdmin: 'desc' },
        { isEventManager: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async updateMemberRole(
    bandId: number,
    userId: number,
    data: UpdateMemberDto,
  ) {
    const member = await this.prisma.membersofBands.findFirst({
      where: {
        bandId,
        userId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }

    // Si se está activando isEventManager, desactivar el actual eventManager
    if (data.isEventManager === true) {
      // Buscar si hay otro eventManager en la banda
      const currentEventManager = await this.prisma.membersofBands.findFirst({
        where: {
          bandId,
          isEventManager: true,
          userId: { not: userId }, // Que no sea el mismo usuario
        },
      });

      // Si existe otro eventManager, desactivarlo en una transacción
      if (currentEventManager) {
        const result = await this.prisma.$transaction(async (prisma) => {
          // Desactivar el eventManager actual
          await prisma.membersofBands.update({
            where: { id: currentEventManager.id },
            data: { isEventManager: false },
          });

          // Activar el nuevo eventManager
          return await prisma.membersofBands.update({
            where: { id: member.id },
            data,
          });
        });

        // Emitir evento WebSocket para todos los eventos de esta banda
        await this.notifyEventManagerChange(bandId, userId, member.user.name);

        return result;
      }
    }

    // Si se está desactivando isEventManager
    if (data.isEventManager === false && member.isEventManager) {
      const result = await this.prisma.membersofBands.update({
        where: { id: member.id },
        data,
      });

      // Emitir evento WebSocket indicando que ya no hay event manager
      await this.notifyEventManagerChange(bandId, null, null);

      return result;
    }

    // Si no hay cambio de eventManager, actualizar normalmente
    return await this.prisma.membersofBands.update({
      where: { id: member.id },
      data,
    });
  }

  private async notifyEventManagerChange(
    bandId: number,
    newEventManagerId: number | null,
    newEventManagerName: string | null,
  ) {
    // Obtener todos los eventos activos de esta banda
    const events = await this.prisma.events.findMany({
      where: { bandId },
      select: { id: true },
    });

    // Emitir evento para cada evento de la banda
    events.forEach((event) => {
      const eventManagerChangeEvent = `eventManagerChanged-${event.id}`;
      this.eventsGateway.server.emit(eventManagerChangeEvent, {
        newEventManagerId: newEventManagerId,
        newEventManagerName: newEventManagerName,
        eventId: event.id,
        bandId: bandId,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `[BandsService] Emitido ${eventManagerChangeEvent} - Nuevo manager: ${newEventManagerName || 'ninguno'}`,
      );
    });
  }

  async removeMember(bandId: number, userId: number) {
    const member = await this.prisma.membersofBands.findFirst({
      where: {
        bandId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        band: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }

    // No permitir eliminar al último admin
    if (member.isAdmin) {
      const adminCount = await this.prisma.membersofBands.count({
        where: {
          bandId,
          isAdmin: true,
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'No puedes eliminar al último administrador de la banda',
        );
      }
    }

    await this.prisma.membersofBands.delete({
      where: { id: member.id },
    });

    return {
      message: 'Miembro eliminado exitosamente',
      removedMember: member,
    };
  }
}
