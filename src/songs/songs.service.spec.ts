import { Test, TestingModule } from '@nestjs/testing';
import { SongsService } from './songs.service';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

describe('SongsService', () => {
  let service: SongsService;
  let prismaService: any;
  let eventsGateway: any;

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
    songsEvents: {
      findMany: jest.fn(),
    },
  };

  const mockEventsGateway = {
    server: {
      emit: jest.fn(),
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
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<SongsService>(SongsService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventsGateway = module.get<EventsGateway>(EventsGateway);
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
    it('should update a song without events', async () => {
      const songId = 1;
      const bandId = 1;
      const updateSongDto = {
        title: 'Updated Song',
      };

      const updatedSong = { ...mockSong, title: 'Updated Song' };
      prismaService.songs.update.mockResolvedValue(updatedSong);
      prismaService.songsEvents.findMany.mockResolvedValue([]);

      const result = await service.update(songId, updateSongDto, bandId);

      expect(result).toEqual(updatedSong);
      expect(prismaService.songs.update).toHaveBeenCalledWith({
        where: { id: songId, bandId },
        data: updateSongDto,
      });
      expect(prismaService.songsEvents.findMany).toHaveBeenCalledWith({
        where: { songId },
        include: { event: true },
      });
      expect(eventsGateway.server.emit).not.toHaveBeenCalled();
    });

    it('should update a song and notify events when song is in events', async () => {
      const songId = 1;
      const bandId = 1;
      const updateSongDto = {
        title: 'Updated Song',
      };

      const updatedSong = { ...mockSong, title: 'Updated Song' };
      const mockEventsWithSong = [
        {
          id: 1,
          songId: 1,
          eventId: 100,
          event: { id: 100, name: 'Test Event' },
        },
        {
          id: 2,
          songId: 1,
          eventId: 200,
          event: { id: 200, name: 'Test Event 2' },
        },
      ];

      prismaService.songs.update.mockResolvedValue(updatedSong);
      prismaService.songsEvents.findMany.mockResolvedValue(mockEventsWithSong);

      const result = await service.update(songId, updateSongDto, bandId);

      expect(result).toEqual(updatedSong);
      expect(prismaService.songsEvents.findMany).toHaveBeenCalledWith({
        where: { songId },
        include: { event: true },
      });

      // Verificar que se emitieron eventos WebSocket para cada evento
      expect(eventsGateway.server.emit).toHaveBeenCalledTimes(2);
      expect(eventsGateway.server.emit).toHaveBeenCalledWith(
        'songUpdated-100',
        expect.objectContaining({
          e: '100',
          m: expect.objectContaining({
            sid: songId,
            ct: 'info',
          }),
          u: 'system',
        }),
      );
      expect(eventsGateway.server.emit).toHaveBeenCalledWith(
        'songUpdated-200',
        expect.objectContaining({
          e: '200',
          m: expect.objectContaining({
            sid: songId,
            ct: 'info',
          }),
          u: 'system',
        }),
      );
    });

    it('should determine changeType as "info" when only metadata is updated', async () => {
      const songId = 1;
      const bandId = 1;
      const updateSongDto = {
        title: 'Updated Song',
        artist: 'Updated Artist',
      };

      const updatedSong = { ...mockSong, ...updateSongDto };
      const mockEventsWithSong = [
        {
          id: 1,
          songId: 1,
          eventId: 100,
          event: { id: 100, name: 'Test Event' },
        },
      ];

      prismaService.songs.update.mockResolvedValue(updatedSong);
      prismaService.songsEvents.findMany.mockResolvedValue(mockEventsWithSong);

      await service.update(songId, updateSongDto, bandId);

      expect(eventsGateway.server.emit).toHaveBeenCalledWith(
        'songUpdated-100',
        expect.objectContaining({
          m: expect.objectContaining({
            ct: 'info',
          }),
        }),
      );
    });

    it('should handle WebSocket emission errors gracefully', async () => {
      const songId = 1;
      const bandId = 1;
      const updateSongDto = {
        title: 'Updated Song',
      };

      const updatedSong = { ...mockSong, title: 'Updated Song' };
      const mockEventsWithSong = [
        {
          id: 1,
          songId: 1,
          eventId: 100,
          event: { id: 100, name: 'Test Event' },
        },
      ];

      prismaService.songs.update.mockResolvedValue(updatedSong);
      prismaService.songsEvents.findMany.mockResolvedValue(mockEventsWithSong);
      eventsGateway.server.emit.mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      // No debería lanzar error, solo loggearlo
      const result = await service.update(songId, updateSongDto, bandId);

      expect(result).toEqual(updatedSong);
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
