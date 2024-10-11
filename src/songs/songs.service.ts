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
    return `This action returns all songs`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} song`;
  }

  async update(id: number, updateSongDto: UpdateSongDto) {
    return `This action updates a #${id} song`;
  }

  async remove(id: number) {
    return `This action removes a #${id} song`;
  }
}
