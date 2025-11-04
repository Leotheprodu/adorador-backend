import { Test, TestingModule } from '@nestjs/testing';
import { SongsService } from './songs.service';
import { PrismaService } from '../prisma.service';

describe('SongsService', () => {
  let service: SongsService;
  let prismaService: any;

  const mockSong = {
    id: 1,
    title: 'Test Song',
    artist: 'Test Artist',
    songType: 'worship',
    youtubeLink: 'https://youtube.com/test',
    key: 'C',
    tempo: 120,
    bandId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    events: [],
    lyrics: [],
    _count: {
      events: 0,
      lyrics: 0,
    },
  };

  const mockPrismaService = {
    songs: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SongsService>(SongsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a song', async () => {
      const createSongDto = {
        title: 'Test Song',
        artist: 'Test Artist',
        songType: 'worship' as any,
        youtubeLink: 'https://youtube.com/test',
        key: 'C' as any,
        tempo: 120,
      };
      const bandId = 1;

      prismaService.songs.create.mockResolvedValue(mockSong);

      const result = await service.create(createSongDto, bandId);

      expect(result).toEqual(mockSong);
      expect(prismaService.songs.create).toHaveBeenCalledWith({
        data: { ...createSongDto, bandId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all songs for a band', async () => {
      const bandId = 1;
      const mockSongs = [mockSong];

      prismaService.songs.findMany.mockResolvedValue(mockSongs);

      const result = await service.findAll(bandId);

      expect(result).toEqual(mockSongs);
      expect(prismaService.songs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bandId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a song by id and bandId', async () => {
      const songId = 1;
      const bandId = 1;

      prismaService.songs.findUnique.mockResolvedValue(mockSong);

      const result = await service.findOne(songId, bandId);

      expect(result).toEqual(mockSong);
      expect(prismaService.songs.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: songId, bandId },
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a song', async () => {
      const songId = 1;
      const bandId = 1;
      const updateSongDto = {
        title: 'Updated Song',
      };

      const updatedSong = { ...mockSong, title: 'Updated Song' };
      prismaService.songs.update.mockResolvedValue(updatedSong);

      const result = await service.update(songId, updateSongDto, bandId);

      expect(result).toEqual(updatedSong);
      expect(prismaService.songs.update).toHaveBeenCalledWith({
        where: { id: songId, bandId },
        data: updateSongDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a song', async () => {
      const songId = 1;
      const bandId = 1;

      prismaService.songs.delete.mockResolvedValue(mockSong);

      const result = await service.remove(songId, bandId);

      expect(result).toEqual(mockSong);
      expect(prismaService.songs.delete).toHaveBeenCalledWith({
        where: { id: songId, bandId },
      });
    });
  });

  describe('findAllSongs', () => {
    it('should return paginated songs', async () => {
      const page = 1;
      const limit = 10;
      const mockSongs = [mockSong];
      const total = 1;

      prismaService.songs.count.mockResolvedValue(total);
      prismaService.songs.findMany.mockResolvedValue(mockSongs);

      const result = await service.findAllSongs(page, limit);

      expect(result).toEqual({
        total,
        page,
        limit,
        data: mockSongs,
      });
      expect(prismaService.songs.count).toHaveBeenCalled();
      expect(prismaService.songs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: limit,
        }),
      );
    });
  });
});
