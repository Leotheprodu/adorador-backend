import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBandDto } from './dto/create-band.dto';
import { passwordCompare } from '../users/utils/handlePassword';

@Injectable()
export class BandsService {
  constructor(private prisma: PrismaService) {}

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
}
