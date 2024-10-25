import { Injectable } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}
  async create(createSongDto: CreateSongDto, churchId: number) {
    return await this.prisma.songs.create({
      data: { ...createSongDto, churchId },
    });
  }

  async findAll(churchId: number) {
    return await this.prisma.songs.findMany({
      where: { churchId },
      omit: {
        createdAt: true,
        updatedAt: true,
        churchId: true,
      },
    });
  }

  async findOne(id: number, churchId: number) {
    return await this.prisma.songs.findUnique({
      where: { id, churchId },
    });
  }

  async update(id: number, updateSongDto: UpdateSongDto, churchId: number) {
    return await this.prisma.songs.update({
      where: { id, churchId },
      data: updateSongDto,
    });
  }

  async remove(id: number, churchId: number) {
    return await this.prisma.songs.delete({
      where: { id, churchId },
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
