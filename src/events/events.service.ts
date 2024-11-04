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

  async create(
    createEventDto: CreateEventDto,
    churchId: number,
    eventManagerId: number,
  ) {
    return this.prisma.events.create({
      data: { ...createEventDto, churchId, eventManagerId },
    });
  }

  async findAll(churchId: number, includeAllDates: boolean) {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Establece la hora en 00:00:00 para que incluya los eventos de hoy
    return this.prisma.events.findMany({
      where: {
        churchId,
        ...(includeAllDates ? {} : { date: { gt: currentDate } }), // Aplica el filtro de fecha solo si includeAllDates es false
      },
      orderBy: {
        date: 'asc', // Ordena por fecha, de más viejo a más nuevo
      },
      omit: {
        createdAt: true,
        updatedAt: true,
        churchId: true,
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

  async findOne(id: number, churchId: number) {
    return this.prisma.events.findUnique({
      where: { id, churchId },
      select: {
        id: true,
        title: true,
        date: true,
        eventManagerId: true,

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

  async update(id: number, updateEventDto: UpdateEventDto, churchId: number) {
    return this.prisma.events.update({
      where: { id, churchId },
      data: updateEventDto,
    });
  }

  async remove(id: number, churchId: number) {
    return this.prisma.events.delete({
      where: { id, churchId },
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

  async getEventSongs(id: number, churchId: number) {
    return this.prisma.events.findUnique({
      where: { id, churchId },
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
  async changeEventManager(id: number, eventManagerId: number) {
    const result = await this.prisma.events.update({
      where: { id },
      data: { eventManagerId },
      select: {
        id: true,
        eventManagerId: true,
      },
    });

    // Clear messages from EventsGateway
    this.eventsGateway.cleanUpEventManagersForEvent(id);

    return result;
  }

  async getEventManagerByEventId(id: number) {
    return this.prisma.events.findUnique({
      where: { id },
      select: {
        eventManagerId: true,
      },
    });
  }
}
