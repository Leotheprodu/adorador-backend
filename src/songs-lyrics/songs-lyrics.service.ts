import { Injectable } from '@nestjs/common';
import { CreateSongsLyricDto } from './dto/create-songs-lyric.dto';
import { UpdateSongsLyricDto } from './dto/update-songs-lyric.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SongsLyricsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSongsLyricDto, songId: number) {
    return await this.prisma.songs_lyrics.create({
      data: { ...data, songId },
    });
  }

  async findAll(songId: number) {
    return await this.prisma.songs_lyrics.findMany({
      where: { songId },
    });
  }

  async findOne(id: number, songId: number) {
    return await this.prisma.songs_lyrics.findUnique({
      where: { id, songId },
    });
  }

  async update(
    id: number,
    songId: number,
    updateSongsLyricDto: UpdateSongsLyricDto,
  ) {
    return await this.prisma.songs_lyrics.update({
      where: { id, songId },
      data: updateSongsLyricDto,
    });
  }

  async remove(id: number, songId: number) {
    return await this.prisma.songs_lyrics.delete({
      where: { id, songId },
    });
  }
}
