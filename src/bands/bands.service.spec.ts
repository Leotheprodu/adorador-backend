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
      songs: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      songs_lyrics: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      songs_Chords: {
        deleteMany: jest.fn(),
      },
      events: {
        deleteMany: jest.fn(),
      },
      membersofBands: {
        deleteMany: jest.fn(),
      },
      users: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
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
    it('should create a band and add creator as admin member', async () => {
      const createBandDto = { name: 'New Band' };
      const userId = 1;
      const mockBand = {
        id: 1,
        name: 'New Band',
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [
          {
            id: 1,
            userId: 1,
            bandId: 1,
            role: 'Líder/Admin',
            active: true,
            isAdmin: true,
            isEventManager: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            user: {
              id: 1,
              name: 'Test User',
              phone: '+1234567890',
            },
          },
        ],
      };
      prismaService.bands.create.mockResolvedValue(mockBand);

      const result = await service.createBand(createBandDto, userId);

      expect(prismaService.bands.create).toHaveBeenCalledWith({
        data: {
          ...createBandDto,
          members: {
            create: {
              userId,
              role: 'Líder/Admin',
              active: true,
              isAdmin: true,
              isEventManager: true,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
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
    it('should delete a band with cascade deletion', async () => {
      const bandId = 1;
      const mockBand = {
        id: 1,
        name: 'Band 1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockSongs = [
        {
          id: 1,
          lyrics: [
            { id: 1, chords: [{ id: 1 }] },
            { id: 2, chords: [] },
          ],
        },
        {
          id: 2,
          lyrics: [],
        },
      ];

      // Mock de $transaction para que ejecute el callback inmediatamente con prismaService
      prismaService.$transaction.mockImplementation((callback) => {
        return callback(prismaService);
      });

      // Mock de las operaciones dentro de la transacción
      prismaService.songs.findMany.mockResolvedValue(mockSongs);
      prismaService.songs_Chords.deleteMany.mockResolvedValue({ count: 1 });
      prismaService.songs_lyrics.deleteMany.mockResolvedValue({ count: 2 });
      prismaService.songs.deleteMany.mockResolvedValue({ count: 2 });
      prismaService.events.deleteMany.mockResolvedValue({ count: 1 });
      prismaService.membersofBands.deleteMany.mockResolvedValue({ count: 1 });
      prismaService.bands.delete.mockResolvedValue(mockBand);

      const result = await service.deleteBand(bandId);

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.songs_Chords.deleteMany).toHaveBeenCalled();
      expect(prismaService.songs_lyrics.deleteMany).toHaveBeenCalled();
      expect(prismaService.songs.deleteMany).toHaveBeenCalled();
      expect(prismaService.events.deleteMany).toHaveBeenCalled();
      expect(prismaService.membersofBands.deleteMany).toHaveBeenCalled();
      expect(prismaService.bands.delete).toHaveBeenCalledWith({
        where: { id: bandId },
      });
      expect(result).toEqual(mockBand);
    });
  });
});
