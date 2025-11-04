import { Test, TestingModule } from '@nestjs/testing';
import { ChurchesService } from './churches.service';
import { PrismaService } from '../prisma.service';

describe('ChurchesService', () => {
  let service: ChurchesService;
  let prismaService: any;

  const mockChurch = {
    id: 1,
    name: 'Test Church',
    address: 'Test Address',
    createdAt: new Date(),
    updatedAt: new Date(),
    memberships: [],
    _count: {
      memberships: 0,
    },
  };

  const mockPrismaService = {
    churches: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChurchesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChurchesService>(ChurchesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getChurches', () => {
    it('should return all churches', async () => {
      const mockChurches = [mockChurch];

      prismaService.churches.findMany.mockResolvedValue(mockChurches);

      const result = await service.getChurches();

      expect(result).toEqual(mockChurches);
      expect(prismaService.churches.findMany).toHaveBeenCalled();
    });
  });

  describe('createChurch', () => {
    it('should create a church', async () => {
      const createChurchDto = {
        name: 'Test Church',
        country: 'Test Country',
        address: 'Test Address',
        aniversary: new Date('2020-01-01'),
      };

      prismaService.churches.create.mockResolvedValue(mockChurch);

      const result = await service.createChurch(createChurchDto);

      expect(result).toEqual(mockChurch);
      expect(prismaService.churches.create).toHaveBeenCalledWith({
        data: createChurchDto,
      });
    });
  });

  describe('getChurch', () => {
    it('should return a church by id', async () => {
      const churchId = 1;

      prismaService.churches.findUnique.mockResolvedValue(mockChurch);

      const result = await service.getChurch(churchId);

      expect(result).toEqual(mockChurch);
      expect(prismaService.churches.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: churchId },
        }),
      );
    });
  });

  describe('updateChurch', () => {
    it('should update a church', async () => {
      const churchId = 1;
      const updateChurchDto = {
        name: 'Updated Church',
        country: 'Updated Country',
        address: 'Updated Address',
        aniversary: new Date('2021-01-01'),
      };

      const updatedChurch = { ...mockChurch, name: 'Updated Church' };
      prismaService.churches.update.mockResolvedValue(updatedChurch);

      const result = await service.updateChurch(churchId, updateChurchDto);

      expect(result).toEqual(updatedChurch);
      expect(prismaService.churches.update).toHaveBeenCalledWith({
        where: { id: churchId },
        data: updateChurchDto,
      });
    });
  });

  describe('deleteChurch', () => {
    it('should delete a church', async () => {
      const churchId = 1;

      prismaService.churches.delete.mockResolvedValue(mockChurch);

      const result = await service.deleteChurch(churchId);

      expect(result).toEqual(mockChurch);
      expect(prismaService.churches.delete).toHaveBeenCalledWith({
        where: { id: churchId },
      });
    });
  });
});
