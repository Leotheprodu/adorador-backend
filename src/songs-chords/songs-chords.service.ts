import { Injectable, Logger } from '@nestjs/common';
import { CreateSongsChordDto } from './dto/create-songs-chord.dto';
import { UpdateSongsChordDto } from './dto/update-songs-chord.dto';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { compressMessage } from '../events/interfaces/websocket-messages.interface';

@Injectable()
export class SongsChordsService {
  private readonly logger = new Logger(SongsChordsService.name);

  constructor(
    private prima: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Notifica a todos los eventos que contienen una canción que fue actualizada
   */
  private async notifySongUpdateFromLyric(lyricId: number) {
    try {
      // Obtener el songId desde el lyricId
      const lyric = await this.prima.songs_lyrics.findUnique({
        where: { id: lyricId },
        select: { songId: true },
      });

      if (!lyric) {
        this.logger.warn(
          `Lyric ${lyricId} not found, cannot notify song update`,
        );
        return;
      }

      const songId = lyric.songId;

      // Encontrar todos los eventos que contienen esta canción
      const eventsWithSong = await this.prima.songsEvents.findMany({
        where: { songId },
        include: {
          event: true,
        },
      });

      if (eventsWithSong.length > 0) {
        this.logger.log(
          `Acordes de canción ${songId} actualizados. Notificando a ${eventsWithSong.length} eventos`,
        );

        // Emitir evento WebSocket a cada evento afectado
        for (const eventSong of eventsWithSong) {
          const eventId = eventSong.event.id;

          try {
            // Formato comprimido
            const message = compressMessage(
              eventId.toString(),
              {
                sid: songId,
                ct: 'lyrics', // Los acordes se consideran parte de las letras
              },
              'system',
            );

            // Emitir a todos los clientes conectados a este evento
            this.eventsGateway.server.emit(`songUpdated-${eventId}`, message);

            this.logger.log(
              `✅ Emitido songUpdated-${eventId} para canción ${songId} (acordes actualizados)`,
            );
          } catch (error) {
            this.logger.error(
              `❌ Error emitiendo WebSocket para evento ${eventId}: ${error.message}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error notificando actualización de acordes: ${error.message}`,
      );
    }
  }

  async create(createSongsChordDto: CreateSongsChordDto, lyricId: number) {
    const result = await this.prima.songs_Chords.create({
      data: {
        ...createSongsChordDto,
        lyricId: lyricId,
      },
    });

    // Notificar a todos los eventos
    await this.notifySongUpdateFromLyric(lyricId);

    return result;
  }

  findAll(lyricId: number) {
    return this.prima.songs_Chords.findMany({
      where: {
        lyricId,
      },
    });
  }

  findOne(id: number, lyricId: number) {
    return this.prima.songs_Chords.findUnique({
      where: {
        id,
        lyricId,
      },
    });
  }

  async update(
    id: number,
    lyricId: number,
    updateSongsChordDto: UpdateSongsChordDto,
  ) {
    const result = await this.prima.songs_Chords.update({
      where: {
        id,
        lyricId,
      },
      data: updateSongsChordDto,
    });

    // Notificar a todos los eventos
    await this.notifySongUpdateFromLyric(lyricId);

    return result;
  }

  async remove(id: number, lyricId: number) {
    const result = await this.prima.songs_Chords.delete({
      where: {
        id,
        lyricId,
      },
    });

    // Notificar a todos los eventos
    await this.notifySongUpdateFromLyric(lyricId);

    return result;
  }
}
