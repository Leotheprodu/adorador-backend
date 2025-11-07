import { Injectable, Logger } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { compressMessage } from '../events/interfaces/websocket-messages.interface';

@Injectable()
export class SongsService {
  private readonly logger = new Logger(SongsService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}
  async create(createSongDto: CreateSongDto, bandId: number) {
    return await this.prisma.songs.create({
      data: { ...createSongDto, bandId },
    });
  }

  async findAll(bandId: number) {
    return await this.prisma.songs.findMany({
      where: { bandId },
      omit: {
        createdAt: true,
        updatedAt: true,
        bandId: true,
      },
      include: {
        _count: {
          select: { events: true, lyrics: true },
        },
      },
    });
  }

  async findOne(id: number, bandId: number) {
    return await this.prisma.songs.findUnique({
      where: { id, bandId },
      omit: {
        createdAt: true,
        updatedAt: true,
        bandId: true,
      },
      include: {
        lyrics: {
          orderBy: {
            position: 'asc',
          },

          omit: {
            createdAt: true,
            updatedAt: true,
            songId: true,
            structureId: true,
          },
          include: {
            structure: {
              omit: {
                createdAt: true,
                updatedAt: true,
              },
            },
            chords: {
              orderBy: {
                position: 'asc',
              },
              omit: {
                createdAt: true,
                updatedAt: true,
                lyricId: true,
              },
            },
          },
        },
        _count: {
          select: { events: true, lyrics: true },
        },
      },
    });
  }

  /**
   * Determina el tipo de cambio basado en los campos actualizados
   */
  private determineChangeType(
    updateDto: UpdateSongDto,
  ): 'lyrics' | 'info' | 'all' {
    const updateKeys = Object.keys(updateDto);

    // Campos relacionados con metadata
    const infoFields = [
      'title',
      'artist',
      'key',
      'tempo',
      'youtubeLink',
      'songType',
    ];

    const hasInfoUpdate = updateKeys.some((key) => infoFields.includes(key));

    // Si solo se actualizó la metadata
    if (
      hasInfoUpdate &&
      updateKeys.length ===
        updateKeys.filter((key) => infoFields.includes(key)).length
    ) {
      return 'info';
    }

    // Por defecto retorna 'all' ya que las letras se manejan en otra tabla
    return 'all';
  }

  async update(id: number, updateSongDto: UpdateSongDto, bandId: number) {
    // 1. Actualizar la canción
    const updatedSong = await this.prisma.songs.update({
      where: { id, bandId },
      data: updateSongDto,
    });

    try {
      // 2. Encontrar todos los eventos que contienen esta canción
      const eventsWithSong = await this.prisma.songsEvents.findMany({
        where: { songId: id },
        include: {
          event: true,
        },
      });

      if (eventsWithSong.length > 0) {
        // 3. Determinar el tipo de cambio
        const changeType = this.determineChangeType(updateSongDto);

        this.logger.log(
          `Canción ${id} actualizada. Notificando a ${eventsWithSong.length} eventos (tipo: ${changeType})`,
        );

        // 4. Emitir evento WebSocket a cada evento afectado
        for (const eventSong of eventsWithSong) {
          const eventId = eventSong.event.id;

          try {
            // Formato comprimido
            const message = compressMessage(
              eventId.toString(),
              {
                sid: id,
                ct: changeType,
              },
              'system',
            );

            // Emitir a todos los clientes conectados a este evento
            this.eventsGateway.server.emit(`songUpdated-${eventId}`, message);

            this.logger.log(
              `✅ Emitido songUpdated-${eventId} para canción ${id} (tipo: ${changeType})`,
            );
          } catch (error) {
            this.logger.error(
              `❌ Error emitiendo WebSocket para evento ${eventId}: ${error.message}`,
            );
          }
        }
      } else {
        this.logger.log(
          `Canción ${id} actualizada pero no está en ningún evento activo`,
        );
      }
    } catch (error) {
      // No fallar la actualización si el WebSocket falla
      this.logger.error(
        `Error notificando actualización de canción ${id}: ${error.message}`,
      );
    }

    return updatedSong;
  }

  async remove(id: number, bandId: number) {
    return await this.prisma.songs.delete({
      where: { id, bandId },
    });
  }

  async findAllSongs(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const total = await this.prisma.songs.count();
    const songs = await this.prisma.songs.findMany({
      skip,
      take: limit,
      omit: {
        createdAt: true,
        updatedAt: true,
      },
    });
    return {
      total,
      page,
      limit,
      data: songs,
    };
  }
}
