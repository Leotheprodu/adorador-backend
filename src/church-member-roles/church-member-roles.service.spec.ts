import { Test, TestingModule } from '@nestjs/testing';
import { ChurchMemberRolesService } from './church-member-roles.service';
import { PrismaService } from '../prisma.service';

describe('ChurchMemberRolesService', () => {
  let service: ChurchMemberRolesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    churchMemberRoles: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChurchMemberRolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChurchMemberRolesService>(ChurchMemberRolesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a church member role', async () => {
      const createDto = {
        roleId: 1,
        startDateTime: new Date('2025-01-01'),
        active: true,
      };
      const membershipId = 5;
      const mockRole = {
        id: 1,
        roleId: 1,
        membershipId: 5,
        startDateTime: new Date('2025-01-01'),
        active: true,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.churchMemberRoles.create.mockResolvedValue(mockRole);

      const result = await service.create(createDto, membershipId);

      expect(result).toEqual(mockRole);
      expect(prismaService.churchMemberRoles.create).toHaveBeenCalledWith({
        data: { ...createDto, membershipId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all roles for a membership', async () => {
      const membershipId = 5;
      const mockRoles = [
        {
          id: 1,
          roleId: 1,
          membershipId: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          roleId: 2,
          membershipId: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.churchMemberRoles.findMany.mockResolvedValue(mockRoles);

      const result = await service.findAll(membershipId);

      expect(result).toEqual(mockRoles);
      expect(prismaService.churchMemberRoles.findMany).toHaveBeenCalledWith({
        where: { membershipId },
      });
    });
  });

  describe('findOne', () => {
    it('should return a church member role by id', async () => {
      const id = 1;
      const mockRole = {
        id: 1,
        roleId: 1,
        membershipId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.churchMemberRoles.findUnique.mockResolvedValue(
        mockRole,
      );

      const result = await service.findOne(id);

      expect(result).toEqual(mockRole);
      expect(prismaService.churchMemberRoles.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('update', () => {
    it('should update a church member role', async () => {
      const id = 1;
      const updateDto = {
        roleId: 3,
        endDate: new Date('2025-12-31'),
      };
      const mockRole = {
        id: 1,
        roleId: 3,
        membershipId: 5,
        startDateTime: new Date('2025-01-01'),
        active: false,
        endDate: new Date('2025-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.churchMemberRoles.update.mockResolvedValue(mockRole);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(mockRole);
      expect(prismaService.churchMemberRoles.update).toHaveBeenCalledWith({
        where: { id },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a church member role', async () => {
      const id = 1;
      const mockRole = {
        id: 1,
        roleId: 1,
        membershipId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.churchMemberRoles.delete.mockResolvedValue(mockRole);

      const result = await service.remove(id);

      expect(result).toEqual(mockRole);
      expect(prismaService.churchMemberRoles.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});
