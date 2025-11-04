import { Test, TestingModule } from '@nestjs/testing';
import { BandsService } from './bands.service';
import { PrismaService } from '../prisma.service';

describe('BandsService', () => {
  let service: BandsService;
  let prismaService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      bands: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BandsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BandsService>(BandsService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBands', () => {
    it('should return all bands', async () => {
      const mockBands = [
        {
          id: 1,
          name: 'Band 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaService.bands.findMany.mockResolvedValue(mockBands);

      const result = await service.getBands();

      expect(prismaService.bands.findMany).toHaveBeenCalledWith({
        omit: {
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockBands);
    });
  });

  describe('getBandsByUserId', () => {
    it('should return bands for a user', async () => {
      const userId = 1;
      const mockBands = [
        {
          id: 1,
          name: 'Band 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          events: [
            {
              id: 1,
              name: 'Event 1',
              date: new Date('2025-12-01'),
              bandId: 1,
              churchId: 1,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          _count: { members: 1, events: 1, songs: 1 },
        },
      ];
      prismaService.bands.findMany.mockResolvedValue(mockBands);

      const result = await service.getBandsByUserId(userId);

      expect(prismaService.bands.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            members: {
              some: {
                userId,
              },
            },
          },
          omit: {
            createdAt: true,
            updatedAt: true,
          },
        }),
      );
      expect(result).toEqual(mockBands);
    });
  });

  describe('createBand', () => {
    it('should create a new band', async () => {
      const createBandDto = { name: 'New Band' };
      const mockBand = {
        id: 1,
        name: 'New Band',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.bands.create.mockResolvedValue(mockBand);

      const result = await service.createBand(createBandDto);

      expect(prismaService.bands.create).toHaveBeenCalledWith({
        data: createBandDto,
      });
      expect(result).toEqual(mockBand);
    });
  });

  describe('getBand', () => {
    it('should return a band by id', async () => {
      const bandId = 1;
      const mockBand = {
        id: 1,
        name: 'Band 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { events: 2, songs: 5 },
        songs: [
          {
            id: 1,
            title: 'Song 1',
            bandId: 1,
            eventId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        events: [
          {
            id: 1,
            name: 'Event 1',
            date: new Date('2025-12-01'),
            bandId: 1,
            churchId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
      prismaService.bands.findUnique.mockResolvedValue(mockBand);

      const result = await service.getBand(bandId);

      expect(prismaService.bands.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: bandId },
          omit: {
            createdAt: true,
            updatedAt: true,
          },
        }),
      );
      expect(result).toEqual(mockBand);
    });
  });

  describe('updateBand', () => {
    it('should update a band', async () => {
      const bandId = 1;
      const updateData = { name: 'Updated Band' };
      const mockBand = {
        id: 1,
        name: 'Updated Band',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.bands.update.mockResolvedValue(mockBand);

      const result = await service.updateBand(bandId, updateData);

      expect(prismaService.bands.update).toHaveBeenCalledWith({
        where: { id: bandId },
        data: updateData,
      });
      expect(result).toEqual(mockBand);
    });
  });

  describe('deleteBand', () => {
    it('should delete a band', async () => {
      const bandId = 1;
      const mockBand = {
        id: 1,
        name: 'Band 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.bands.delete.mockResolvedValue(mockBand);

      const result = await service.deleteBand(bandId);

      expect(prismaService.bands.delete).toHaveBeenCalledWith({
        where: { id: bandId },
      });
      expect(result).toEqual(mockBand);
    });
  });
});
