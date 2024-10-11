import { Injectable } from '@nestjs/common';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}
  async create(createSongDto: CreateSongDto) {
    return await this.prisma.songs.create({
      data: createSongDto,
    });
  }

  async findAll() {
    return await this.prisma.songs.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.songs.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateSongDto: UpdateSongDto) {
    return await this.prisma.songs.update({
      where: { id },
      data: updateSongDto,
    });
  }

  async remove(id: number) {
    return await this.prisma.songs.delete({
      where: { id },
    });
  }
}
