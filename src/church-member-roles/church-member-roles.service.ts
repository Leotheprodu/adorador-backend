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

  async findAll() {
    return `This action returns all churchMemberRoles`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} churchMemberRole`;
  }

  async update(
    id: number,
    updateChurchMemberRoleDto: UpdateChurchMemberRoleDto,
  ) {
    return `This action updates a #${id} churchMemberRole`;
  }

  async remove(id: number) {
    return `This action removes a #${id} churchMemberRole`;
  }
}
