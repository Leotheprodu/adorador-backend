import { Injectable } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}
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

  async update(id: number, updateSongDto: UpdateSongDto, bandId: number) {
    return await this.prisma.songs.update({
      where: { id, bandId },
      data: updateSongDto,
    });
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
