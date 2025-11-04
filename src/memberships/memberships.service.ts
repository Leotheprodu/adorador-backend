import { Injectable } from '@nestjs/common';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMembershipDto, userId: number) {
    return await this.prisma.memberships.create({
      data: { ...data, userId },
    });
  }

  async findAll(userId: number) {
    return await this.prisma.memberships.findMany({
      where: { userId },
    });
  }

  async findOne(id: number) {
    return await this.prisma.memberships.findUnique({
      where: { id },
      include: {
        church: true,
        user: true,
        roles: true,
      },
    });
  }

  async update(id: number, data: UpdateMembershipDto) {
    return await this.prisma.memberships.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return await this.prisma.memberships.delete({
      where: { id },
    });
  }

  async getMemberships(userId: number, churchId: number) {
    return await this.prisma.memberships.findFirst({
      where: { userId, churchId },
    });
  }
}
