import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto, churchId: number) {
    return this.prisma.events.create({
      data: { ...createEventDto, churchId },
    });
  }

  async findAll(churchId: number) {
    return this.prisma.events.findMany({
      where: { churchId },
    });
  }

  async findOne(id: number, churchId: number) {
    return this.prisma.events.findUnique({
      where: { id, churchId },
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
}
