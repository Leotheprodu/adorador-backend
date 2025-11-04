import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsService } from './memberships.service';
import { PrismaService } from '../prisma.service';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    memberships: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a membership', async () => {
      const createDto = {
        churchId: 1,
        active: true,
        memberSince: new Date('2025-01-01'),
      };
      const userId = 5;
      const mockMembership = {
        id: 1,
        userId: 5,
        churchId: 1,
        roleId: 2,
        active: true,
        memberSince: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.memberships.create.mockResolvedValue(mockMembership);

      const result = await service.create(createDto, userId);

      expect(result).toEqual(mockMembership);
      expect(prismaService.memberships.create).toHaveBeenCalledWith({
        data: { ...createDto, userId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all memberships for a user', async () => {
      const userId = 5;
      const mockMemberships = [
        {
          id: 1,
          userId: 5,
          churchId: 1,
          roleId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 5,
          churchId: 3,
          roleId: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.memberships.findMany.mockResolvedValue(mockMemberships);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockMemberships);
      expect(prismaService.memberships.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('findOne', () => {
    it('should return a membership with includes', async () => {
      const id = 1;
      const mockMembership = {
        id: 1,
        userId: 5,
        churchId: 1,
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        church: { id: 1, name: 'Test Church' },
        user: { id: 5, name: 'Test User' },
        roles: { id: 2, name: 'Admin' },
      };

      mockPrismaService.memberships.findUnique.mockResolvedValue(
        mockMembership,
      );

      const result = await service.findOne(id);

      expect(result).toEqual(mockMembership);
      expect(prismaService.memberships.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          church: true,
          user: true,
          roles: true,
        },
      });
    });
  });

  describe('update', () => {
    it('should update a membership', async () => {
      const id = 1;
      const updateDto = { active: false };
      const mockMembership = {
        id: 1,
        userId: 5,
        churchId: 1,
        roleId: 2,
        active: false,
        memberSince: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.memberships.update.mockResolvedValue(mockMembership);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(mockMembership);
      expect(prismaService.memberships.update).toHaveBeenCalledWith({
        where: { id },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a membership', async () => {
      const id = 1;
      const mockMembership = {
        id: 1,
        userId: 5,
        churchId: 1,
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.memberships.delete.mockResolvedValue(mockMembership);

      const result = await service.remove(id);

      expect(result).toEqual(mockMembership);
      expect(prismaService.memberships.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('getMemberships', () => {
    it('should return a membership for user and church', async () => {
      const userId = 5;
      const churchId = 1;
      const mockMembership = {
        id: 1,
        userId: 5,
        churchId: 1,
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.memberships.findFirst.mockResolvedValue(mockMembership);

      const result = await service.getMemberships(userId, churchId);

      expect(result).toEqual(mockMembership);
      expect(prismaService.memberships.findFirst).toHaveBeenCalledWith({
        where: { userId, churchId },
      });
    });
  });
});
