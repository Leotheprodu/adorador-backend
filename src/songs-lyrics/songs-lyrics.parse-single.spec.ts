import { Test, TestingModule } from '@nestjs/testing';
import { SongsLyricsService } from './songs-lyrics.service';
import { PrismaService } from '../prisma.service';
import { LyricsNormalizerService } from './services/lyrics-normalizer.service';
import { ChordProcessorService } from './services/chord-processor.service';
import { LyricsParserService } from './services/lyrics-parser.service';
import { EventsGateway } from '../events/events.gateway';

describe('SongsLyricsService - parseAndUpdateSingleLyric', () => {
  let service: SongsLyricsService;
  let prismaService: PrismaService;
  let lyricsParser: LyricsParserService;
  let chordProcessor: ChordProcessorService;

  const mockPrismaService = {
    songs_lyrics: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    songs_Chords: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
    },
    songsEvents: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventsGateway = {
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsLyricsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
        LyricsNormalizerService,
        ChordProcessorService,
        LyricsParserService,
      ],
    }).compile();

    service = module.get<SongsLyricsService>(SongsLyricsService);
    prismaService = module.get<PrismaService>(PrismaService);
    lyricsParser = module.get<LyricsParserService>(LyricsParserService);
    chordProcessor = module.get<ChordProcessorService>(ChordProcessorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('parseAndUpdateSingleLyric', () => {
    it('should parse and update a lyric with chords', async () => {
      const lyricId = 1;
      const songId = 1;
      const textContent = '    C       Am\nGloria a Dios';

      const existingLyric = {
        id: lyricId,
        position: 1,
        lyrics: 'Old lyrics',
        songId,
        structureId: 1,
      };

      const updatedLyric = {
        id: lyricId,
        position: 1,
        lyrics: 'Gloria a Dios',
        songId,
        structureId: 1,
      };

      const createdChords = [
        { id: 1, rootNote: 'C', chordQuality: '', slashChord: '', position: 1 },
        {
          id: 2,
          rootNote: 'Am',
          chordQuality: '',
          slashChord: '',
          position: 3,
        },
      ];

      mockPrismaService.songs_lyrics.findUnique.mockResolvedValue(
        existingLyric,
      );
      mockPrismaService.songs_Chords.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.songs_lyrics.update.mockResolvedValue(updatedLyric);
      mockPrismaService.songs_Chords.create.mockResolvedValue({
        id: 1,
        lyricId,
        rootNote: 'C',
        chordType: '',
        position: 1,
      });
      mockPrismaService.songs_Chords.createMany.mockResolvedValue({
        count: 2,
      });
      mockPrismaService.songsEvents.findMany.mockResolvedValue([]);

      const result = await service.parseAndUpdateSingleLyric(
        lyricId,
        songId,
        textContent,
      );

      // Verificar que el resultado tiene la estructura correcta
      expect(result).toBeDefined();
      expect(result.id).toBe(lyricId);

      // Verificar que deleteMany fue llamado
      expect(mockPrismaService.songs_Chords.deleteMany).toHaveBeenCalledWith({
        where: { lyricId },
      });

      // Verificar que create fue llamado para crear acordes
      expect(mockPrismaService.songs_Chords.create).toHaveBeenCalled();
    });

    it('should throw error if lyric not found', async () => {
      const lyricId = 999;
      const songId = 1;
      const textContent = 'Some text';

      mockPrismaService.songs_lyrics.findUnique.mockResolvedValue(null);

      await expect(
        service.parseAndUpdateSingleLyric(lyricId, songId, textContent),
      ).rejects.toThrow(`Lyric ${lyricId} not found for song ${songId}`);

      expect(mockPrismaService.songs_lyrics.findUnique).toHaveBeenCalledWith({
        where: { id: lyricId, songId },
        include: { chords: true },
      });
    });

    it('should handle lyrics with no chords', async () => {
      const lyricId = 1;
      const songId = 1;
      const textContent = 'Solo texto sin acordes';

      const existingLyric = {
        id: lyricId,
        position: 1,
        lyrics: 'Old lyrics',
        songId,
        structureId: 1,
      };

      const updatedLyric = {
        id: lyricId,
        position: 1,
        lyrics: 'Solo texto sin acordes',
        songId,
        structureId: 1,
      };

      mockPrismaService.songs_lyrics.findUnique.mockResolvedValue(
        existingLyric,
      );
      mockPrismaService.songs_Chords.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.songs_lyrics.update.mockResolvedValue(updatedLyric);
      mockPrismaService.songsEvents.findMany.mockResolvedValue([]);

      const result = await service.parseAndUpdateSingleLyric(
        lyricId,
        songId,
        textContent,
      );

      expect(mockPrismaService.songs_Chords.createMany).not.toHaveBeenCalled();
    });

    it('should throw error if more than 5 chords detected', async () => {
      const lyricId = 1;
      const songId = 1;
      const textContent = 'C  D  E  F  G  A\nDemasiados acordes';

      const existingLyric = {
        id: lyricId,
        position: 1,
        lyrics: 'Old lyrics',
        songId,
        structureId: 1,
      };

      mockPrismaService.songs_lyrics.findUnique.mockResolvedValue(
        existingLyric,
      );

      await expect(
        service.parseAndUpdateSingleLyric(lyricId, songId, textContent),
      ).rejects.toThrow(
        'Validation failed:\nLine 1 has 6 chords (max 5): "C  D  E  F  G  A"',
      );
    });

    it('should calculate chord positions proportionally', async () => {
      const lyricId = 1;
      const songId = 1;
      const textContent = 'C           D\nGloria a Dios en las alturas';

      const existingLyric = {
        id: lyricId,
        position: 1,
        lyrics: 'Old lyrics',
        songId,
        structureId: 1,
      };

      const updatedLyric = {
        id: lyricId,
        position: 1,
        lyrics: 'Gloria a Dios en las alturas',
        songId,
        structureId: 1,
      };

      mockPrismaService.songs_lyrics.findUnique.mockResolvedValue(
        existingLyric,
      );
      mockPrismaService.songs_Chords.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.songs_lyrics.update.mockResolvedValue(updatedLyric);
      mockPrismaService.songs_Chords.create.mockResolvedValue({
        id: 1,
        lyricId,
        rootNote: 'C',
        chordType: '',
        position: 1,
      });
      mockPrismaService.songs_Chords.createMany.mockResolvedValue({
        count: 2,
      });
      mockPrismaService.songsEvents.findMany.mockResolvedValue([]);

      await service.parseAndUpdateSingleLyric(lyricId, songId, textContent);

      // Verificar que create fue llamado (no createMany porque el servicio usa create en un loop)
      expect(mockPrismaService.songs_Chords.create).toHaveBeenCalled();

      // Verificar que las posiciones están entre 1 y 5
      const calls = mockPrismaService.songs_Chords.create.mock.calls;
      calls.forEach((call: any) => {
        const chord = call[0].data;
        expect(chord.position).toBeGreaterThanOrEqual(1);
        expect(chord.position).toBeLessThanOrEqual(5);
      });
    });

    it('should delete old chords before creating new ones', async () => {
      const lyricId = 1;
      const songId = 1;
      const textContent = '    C\nNuevos acordes';

      const existingLyric = {
        id: lyricId,
        position: 1,
        lyrics: 'Old lyrics',
        songId,
        structureId: 1,
      };

      const updatedLyric = {
        id: lyricId,
        position: 1,
        lyrics: 'Nuevos acordes',
        songId,
        structureId: 1,
      };

      mockPrismaService.songs_lyrics.findUnique.mockResolvedValue(
        existingLyric,
      );
      mockPrismaService.songs_Chords.deleteMany.mockResolvedValue({ count: 2 }); // Had old chords
      mockPrismaService.songs_lyrics.update.mockResolvedValue(updatedLyric);
      mockPrismaService.songs_Chords.create.mockResolvedValue({
        id: 1,
        lyricId,
        rootNote: 'C',
        chordType: '',
        position: 1,
      });
      mockPrismaService.songs_Chords.createMany.mockResolvedValue({
        count: 1,
      });
      mockPrismaService.songsEvents.findMany.mockResolvedValue([]);

      await service.parseAndUpdateSingleLyric(lyricId, songId, textContent);

      // Verificar que deleteMany fue llamado
      expect(mockPrismaService.songs_Chords.deleteMany).toHaveBeenCalledWith({
        where: { lyricId },
      });

      // Verificar que create fue llamado después
      expect(mockPrismaService.songs_Chords.create).toHaveBeenCalled();

      // Verificar el orden: deleteMany debe ser llamado antes que create
      const deleteManyCallOrder =
        mockPrismaService.songs_Chords.deleteMany.mock.invocationCallOrder[0];
      const createCallOrder =
        mockPrismaService.songs_Chords.create.mock.invocationCallOrder[0];
      expect(deleteManyCallOrder).toBeLessThan(createCallOrder);
    });
  });
});
