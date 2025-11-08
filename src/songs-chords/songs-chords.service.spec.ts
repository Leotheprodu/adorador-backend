import { Test, TestingModule } from '@nestjs/testing';
import { SongsChordsService } from './songs-chords.service';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

describe('SongsChordsService', () => {
  let service: SongsChordsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    songs_Chords: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    songs_lyrics: {
      findUnique: jest.fn(),
    },
    songs: {
      findMany: jest.fn(),
    },
    events: {
      findMany: jest.fn(),
    },
  };

  const mockEventsGateway = {
    server: {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsChordsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<SongsChordsService>(SongsChordsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a chord', async () => {
      const createDto = {
        rootNote: 'C',
        chordQuality: 'major' as any,
        slashChord: null as any,
        position: 1 as any,
      };
      const lyricId = 1;
      const mockChord = {
        id: 1,
        lyricId: 1,
        rootNote: 'C',
        chordQuality: 'major',
        slashChord: null,
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.songs_Chords.create.mockResolvedValue(mockChord);

      const result = await service.create(createDto, lyricId);

      expect(result).toEqual(mockChord);
      expect(prismaService.songs_Chords.create).toHaveBeenCalledWith({
        data: { ...createDto, lyricId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all chords for a lyric', async () => {
      const lyricId = 1;
      const mockChords = [
        {
          id: 1,
          lyricId: 1,
          rootNote: 'C',
          chordQuality: 'major',
          slashChord: null,
          position: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          lyricId: 1,
          rootNote: 'G',
          chordQuality: 'major',
          slashChord: null,
          position: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.songs_Chords.findMany.mockResolvedValue(mockChords);

      const result = await service.findAll(lyricId);

      expect(result).toEqual(mockChords);
      expect(prismaService.songs_Chords.findMany).toHaveBeenCalledWith({
        where: { lyricId },
      });
    });
  });

  describe('findOne', () => {
    it('should return a specific chord', async () => {
      const id = 1;
      const lyricId = 1;
      const mockChord = {
        id: 1,
        lyricId: 1,
        rootNote: 'C',
        chordQuality: 'major',
        slashChord: null,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.songs_Chords.findUnique.mockResolvedValue(mockChord);

      const result = await service.findOne(id, lyricId);

      expect(result).toEqual(mockChord);
      expect(prismaService.songs_Chords.findUnique).toHaveBeenCalledWith({
        where: { id, lyricId },
      });
    });
  });

  describe('update', () => {
    it('should update a chord', async () => {
      const id = 1;
      const lyricId = 1;
      const updateDto = { position: 10 };
      const mockChord = {
        id: 1,
        lyricId: 1,
        rootNote: 'C',
        chordQuality: 'major',
        slashChord: null,
        position: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.songs_Chords.update.mockResolvedValue(mockChord);

      const result = await service.update(id, lyricId, updateDto);

      expect(result).toEqual(mockChord);
      expect(prismaService.songs_Chords.update).toHaveBeenCalledWith({
        where: { id, lyricId },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a chord', async () => {
      const id = 1;
      const lyricId = 1;
      const mockChord = {
        id: 1,
        lyricId: 1,
        rootNote: 'C',
        chordQuality: 'major',
        slashChord: null,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.songs_Chords.delete.mockResolvedValue(mockChord);

      const result = await service.remove(id, lyricId);

      expect(result).toEqual(mockChord);
      expect(prismaService.songs_Chords.delete).toHaveBeenCalledWith({
        where: { id, lyricId },
      });
    });
  });
});
