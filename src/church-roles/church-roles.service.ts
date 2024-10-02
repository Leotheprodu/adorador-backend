import { Injectable } from '@nestjs/common';
import { CreateChurchRoleDto } from './dto/create-church-role.dto';
import { UpdateChurchRoleDto } from './dto/update-church-role.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ChurchRolesService {
  constructor(private prisma: PrismaService) {}

  async create(createChurchRoleDto: CreateChurchRoleDto) {
    return `This action adds a new churchRole`;
  }

  async findAll() {
    return `This action returns all churchRoles`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} churchRole`;
  }

  async update(id: number, updateChurchRoleDto: UpdateChurchRoleDto) {
    return `This action updates a #${id} churchRole`;
  }

  async remove(id: number) {
    return `This action removes a #${id} churchRole`;
  }
}
