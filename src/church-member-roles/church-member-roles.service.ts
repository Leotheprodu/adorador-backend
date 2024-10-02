import { Injectable } from '@nestjs/common';
import { CreateChurchMemberRoleDto } from './dto/create-church-member-role.dto';
import { UpdateChurchMemberRoleDto } from './dto/update-church-member-role.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChurchMemberRolesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createChurchMemberRoleDto: CreateChurchMemberRoleDto,
    membershipId: number,
  ) {
    return await this.prisma.churchMemberRoles.create({
      data: { ...createChurchMemberRoleDto, membershipId },
    });
  }

  async findAll(membershipId: number) {
    return await this.prisma.churchMemberRoles.findMany({
      where: { membershipId },
    });
  }

  async findOne(id: number) {
    return await this.prisma.churchMemberRoles.findUnique({
      where: { id },
    });
  }

  async update(
    id: number,
    updateChurchMemberRoleDto: UpdateChurchMemberRoleDto,
  ) {
    return await this.prisma.churchMemberRoles.update({
      where: { id },
      data: updateChurchMemberRoleDto,
    });
  }

  async remove(id: number) {
    return await this.prisma.churchMemberRoles.delete({
      where: { id },
    });
  }
}
