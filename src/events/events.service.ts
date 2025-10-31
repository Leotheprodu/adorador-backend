import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma.service';
import {
  AddSongsToEventDto,
  RemoveSongsToEventDto,
} from './dto/add-songs-to-event.dto';
import { UpdateSongsEventDto } from './dto/update-songs-to-event.dto';
import { EventsGateway } from './events.gateway';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway, // Inject EventsGateway
  ) {}

  async create(createEventDto: CreateEventDto, bandId: number) {
    return this.prisma.events.create({
      data: { ...createEventDto, bandId },
    });
  }

  async findAll(bandId: number) {
    return this.prisma.events.findMany({
      where: {
        bandId,
      },
      orderBy: {
        date: 'asc', // Ordena por fecha, de más viejo a más nuevo
      },
      omit: {
        createdAt: true,
        updatedAt: true,
        bandId: true,
      },
      include: {
        _count: {
          select: {
            songs: true,
          },
        },
      },
    });
  }

  async findOne(id: number, bandId: number) {
    return this.prisma.events.findUnique({
      where: { id, bandId },
      select: {
        id: true,
        title: true,
        date: true,
        bandId: true,
        songs: {
          select: {
            transpose: true,
            order: true,
            song: {
              select: {
                id: true,
                title: true,
                songType: true,
                key: true,
                lyrics: {
                  select: {
                    id: true,
                    position: true,
                    lyrics: true,
                    structure: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                    chords: {
                      omit: {
                        updatedAt: true,
                        createdAt: true,
                        lyricId: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async update(id: number, updateEventDto: UpdateEventDto, bandId: number) {
    return this.prisma.events.update({
      where: { id, bandId },
      data: updateEventDto,
    });
  }

  async remove(id: number, bandId: number) {
    return this.prisma.events.delete({
      where: { id, bandId },
    });
  }

  async addSongsToEvent(id: number, addSongsToEventDto: AddSongsToEventDto) {
    const { songDetails } = addSongsToEventDto;

    const data = songDetails.map(({ songId, order, transpose }) => ({
      eventId: id,
      songId,
      order,
      transpose,
    }));

    const result = await this.prisma.songsEvents.createMany({
      data,
    });

    return result;
  }

  async deleteSongsFromEvent(id: number, songs: RemoveSongsToEventDto) {
    const { songIds } = songs;
    return this.prisma.songsEvents.deleteMany({
      where: {
        eventId: id,
        songId: {
          in: songIds,
        },
      },
    });
  }
  async updateSongsEvent(
    id: number,
    updateSongsEventDto: UpdateSongsEventDto,
  ): Promise<void> {
    const { songDetails } = updateSongsEventDto;

    const updatePromises = songDetails.map(({ songId, order, transpose }) => {
      const updateData: { order?: number; transpose?: number } = {};
      if (order !== undefined) updateData.order = order;
      if (transpose !== undefined) updateData.transpose = transpose;

      return this.prisma.songsEvents.update({
        where: {
          eventId_songId: {
            eventId: id,
            songId,
          },
        },
        data: updateData,
      });
    });

    await Promise.all(updatePromises);
  }

  async getEventSongs(id: number, bandId: number) {
    return this.prisma.events.findUnique({
      where: { id, bandId },
      select: {
        id: true,
        title: true,
        date: true,
        songs: {
          select: {
            songId: true,
            order: true,
            transpose: true,
            song: {
              select: {
                id: true,
                title: true,
                songType: true,
                artist: true,
                key: true,
                tempo: true,
                youtubeLink: true,
                lyrics: {
                  select: {
                    id: true,
                    position: true,
                    lyrics: true,
                    structure: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                    chords: {
                      omit: {
                        updatedAt: true,
                        createdAt: true,
                        lyricId: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }
  //NOTE revisar esta funcion, voy por aqui
  async changeBandEventManager(bandId: number, userId: number) {
    const eventManager = await this.prisma.membersofBands.findFirst({
      where: { bandId, isEventManager: true },
      select: {
        id: true,
      },
    });
    if (eventManager) {
      await this.prisma.membersofBands.update({
        where: { id: eventManager.id },
        data: { isEventManager: false },
      });

      const newEventManager = await this.prisma.membersofBands.findFirst({
        where: { bandId, userId },
        select: {
          id: true,
        },
      });
      const memberofBandData = await this.prisma.membersofBands.update({
        where: { id: newEventManager.id },
        data: { isEventManager: true },
      });
      return memberofBandData; // Devuelve el miembro de la banda actualizado
    } else {
      const newEventManager = await this.prisma.membersofBands.findFirst({
        where: { bandId, userId },
        select: {
          id: true,
        },
      });
      const memberofBandData = await this.prisma.membersofBands.update({
        where: { id: newEventManager.id },
        data: { isEventManager: true },
      });
      return memberofBandData; // Devuelve el miembro de la banda actualizado
    }
  }

  async getEventManagerByEventId(id: number) {
    const event = await this.prisma.events.findUnique({
      where: { id },
      select: {
        band: {
          select: {
            members: {
              where: { isEventManager: true },
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });
    if (
      !event ||
      !event.band ||
      !event.band.members ||
      event.band.members.length === 0
    ) {
      return null; // No hay Event Manager asignado
    }
    return event.band.members[0].userId; // Devuelve el userId del Event Manager
  }

  async getEventManagerIdByBandId(bandId: number) {
    const eventManager = await this.prisma.membersofBands.findFirst({
      where: { bandId, isEventManager: true },
      select: {
        userId: true,
      },
    });
    return eventManager ? eventManager.userId : null; // Devuelve el userId del Event Manager o null si no existe
  }
}
