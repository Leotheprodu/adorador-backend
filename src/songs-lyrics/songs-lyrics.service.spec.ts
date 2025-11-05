import { Test, TestingModule } from '@nestjs/testing';
import { SongsLyricsService } from './songs-lyrics.service';
import { PrismaService } from '../prisma.service';
import { LyricsNormalizerService } from './services/lyrics-normalizer.service';
import { ChordProcessorService } from './services/chord-processor.service';
import { LyricsParserService } from './services/lyrics-parser.service';

describe('SongsLyricsService', () => {
  let service: SongsLyricsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    songs_lyrics: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    songs_Chords: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockLyricsNormalizer = {
    normalize: jest.fn((text) => text.trim()),
  };

  const mockChordProcessor = {
    extractChordsWithPosition: jest.fn(),
    calculateChordPosition: jest.fn(),
    redistributePositions: jest.fn(),
    parseChord: jest.fn(),
  };

  const mockLyricsParser = {
    parseFileContent: jest.fn(),
    validateMaxChordsPerLine: jest.fn(),
    detectStructure: jest.fn(),
    hasChords: jest.fn(),
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
          provide: LyricsNormalizerService,
          useValue: mockLyricsNormalizer,
        },
        {
          provide: ChordProcessorService,
          useValue: mockChordProcessor,
        },
        {
          provide: LyricsParserService,
          useValue: mockLyricsParser,
        },
      ],
    }).compile();

    service = module.get<SongsLyricsService>(SongsLyricsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a song lyric', async () => {
      const createDto = {
        lyrics: 'Amazing grace',
        position: 1,
        structureId: 2,
      };
      const songId = 1;
      const mockLyric = {
        id: 1,
        songId: 1,
        lyrics: 'Amazing grace',
        position: 1,
        structureId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.songs_lyrics.create.mockResolvedValue(mockLyric);

      const result = await service.create(createDto, songId);

      expect(result).toEqual(mockLyric);
      expect(prismaService.songs_lyrics.create).toHaveBeenCalledWith({
        data: { ...createDto, songId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all lyrics for a song with structure and chords', async () => {
      const songId = 1;
      const mockLyrics = [
        {
          id: 1,
          position: 1,
          lyrics: 'Amazing grace',
          structure: {
            id: 2,
            title: 'Verse',
          },
          chords: [
            {
              id: 1,
              rootNote: 'C',
              chordQuality: 'major',
              position: 0,
            },
          ],
        },
      ];

      mockPrismaService.songs_lyrics.findMany.mockResolvedValue(mockLyrics);

      const result = await service.findAll(songId);

      expect(result).toEqual(mockLyrics);
      expect(prismaService.songs_lyrics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { songId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a specific lyric', async () => {
      const id = 1;
      const songId = 1;
      const mockLyric = {
        id: 1,
        songId: 1,
        lyrics: 'Amazing grace',
        position: 1,
        structureId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.songs_lyrics.findUnique.mockResolvedValue(mockLyric);

      const result = await service.findOne(id, songId);

      expect(result).toEqual(mockLyric);
      expect(prismaService.songs_lyrics.findUnique).toHaveBeenCalledWith({
        where: { id, songId },
      });
    });
  });

  describe('update', () => {
    it('should update a lyric', async () => {
      const id = 1;
      const songId = 1;
      const updateDto = { lyrics: 'How sweet the sound' };
      const mockLyric = {
        id: 1,
        songId: 1,
        lyrics: 'How sweet the sound',
        position: 1,
        structureId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.songs_lyrics.update.mockResolvedValue(mockLyric);

      const result = await service.update(id, songId, updateDto);

      expect(result).toEqual(mockLyric);
      expect(prismaService.songs_lyrics.update).toHaveBeenCalledWith({
        where: { id, songId },
        data: updateDto,
      });
    });
  });

  describe('updateArrayOfLyrics', () => {
    it('should update multiple lyrics positions', async () => {
      const songId = 1;
      const lyrics = [
        { id: 1, position: 2 },
        { id: 2, position: 1 },
      ];
      const mockResults = [
        { id: 1, position: 2, songId: 1 },
        { id: 2, position: 1, songId: 1 },
      ];

      mockPrismaService.songs_lyrics.update.mockResolvedValueOnce(
        mockResults[0],
      );
      mockPrismaService.songs_lyrics.update.mockResolvedValueOnce(
        mockResults[1],
      );

      const result = await service.updateArrayOfLyrics(songId, lyrics);

      expect(result).toEqual(mockResults);
      expect(prismaService.songs_lyrics.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove', () => {
    it('should delete a lyric and its chords', async () => {
      const id = 1;
      const songId = 1;
      const mockChords = [{ id: 1, lyricId: 1 }];
      const mockLyric = {
        id: 1,
        songId: 1,
        lyrics: 'Amazing grace',
      };

      mockPrismaService.songs_Chords.findMany.mockResolvedValue(mockChords);
      mockPrismaService.songs_Chords.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.songs_lyrics.delete.mockResolvedValue(mockLyric);

      const result = await service.remove(id, songId);

      expect(result).toEqual(mockLyric);
      expect(prismaService.songs_Chords.findMany).toHaveBeenCalledWith({
        where: { lyricId: id },
      });
      expect(prismaService.songs_Chords.deleteMany).toHaveBeenCalledWith({
        where: { lyricId: id },
      });
      expect(prismaService.songs_lyrics.delete).toHaveBeenCalledWith({
        where: { id, songId },
      });
    });

    it('should delete a lyric without chords', async () => {
      const id = 1;
      const songId = 1;
      const mockLyric = {
        id: 1,
        songId: 1,
        lyrics: 'Amazing grace',
      };

      mockPrismaService.songs_Chords.findMany.mockResolvedValue([]);
      mockPrismaService.songs_lyrics.delete.mockResolvedValue(mockLyric);

      const result = await service.remove(id, songId);

      expect(result).toEqual(mockLyric);
      expect(prismaService.songs_Chords.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('parseAndSaveLyricsWithChords', () => {
    it('should parse and save lyrics with chords successfully', async () => {
      const fileContent = '[Verse]\nC       G\nAmazing grace';
      const buffer = Buffer.from(fileContent);
      const songId = 1;

      mockLyricsParser.parseFileContent.mockReturnValue({
        cleanedLines: ['[Verse]', 'C       G', 'Amazing grace'],
        lineMapping: new Map([
          [0, '[Verse]'],
          [1, 'C       G'],
          [2, 'Amazing grace'],
        ]),
      });
      mockLyricsParser.validateMaxChordsPerLine.mockReturnValue({
        valid: true,
        errors: [],
      });
      mockLyricsParser.detectStructure.mockImplementation((line) => {
        if (line === '[Verse]') return 2;
        return null;
      });
      mockLyricsParser.hasChords.mockImplementation((line) => {
        return line === 'C       G';
      });
      mockChordProcessor.extractChordsWithPosition.mockReturnValue([
        { chord: 'C', charPosition: 0 },
        { chord: 'G', charPosition: 8 },
      ]);
      mockChordProcessor.calculateChordPosition.mockReturnValue(0);
      mockChordProcessor.redistributePositions.mockReturnValue([
        { chord: 'C', charPosition: 0, finalPosition: 0 },
        { chord: 'G', charPosition: 8, finalPosition: 8 },
      ]);
      mockChordProcessor.parseChord.mockImplementation((chord) => ({
        rootNote: chord,
        chordQuality: 'major',
        slashChord: null,
      }));
      mockPrismaService.songs_lyrics.create.mockResolvedValue({
        id: 1,
        songId: 1,
        lyrics: 'Amazing grace',
        position: 1,
        structureId: 2,
      });

      const result = await service.parseAndSaveLyricsWithChords(buffer, songId);

      expect(result).toEqual({
        message:
          'Lyrics and chords processed with validated notes and qualities!',
      });
      expect(mockLyricsParser.parseFileContent).toHaveBeenCalled();
      expect(mockLyricsParser.validateMaxChordsPerLine).toHaveBeenCalled();
    });

    it('should throw error when validation fails', async () => {
      const fileContent = 'Too many chords line';
      const buffer = Buffer.from(fileContent);
      const songId = 1;

      mockLyricsParser.parseFileContent.mockReturnValue({
        cleanedLines: ['Too many chords line'],
        lineMapping: new Map(),
      });
      mockLyricsParser.validateMaxChordsPerLine.mockReturnValue({
        valid: false,
        errors: ['Line 1: Too many chords (6 found, max 5 allowed)'],
      });

      await expect(
        service.parseAndSaveLyricsWithChords(buffer, songId),
      ).rejects.toThrow('File validation failed');
    });
  });

  describe('normalizeLyrics', () => {
    it('should normalize multiple lyrics successfully', async () => {
      const songId = 1;
      const lyricIds = [1, 2, 3];

      const mockLyrics = [
        {
          id: 1,
          songId: 1,
          lyrics: 'AMAZING GRACE!!!',
          position: 1,
          structureId: 2,
        },
        {
          id: 2,
          songId: 1,
          lyrics: '  how sweet the sound  ',
          position: 2,
          structureId: 2,
        },
        {
          id: 3,
          songId: 1,
          lyrics: 'that saved a wretch like me',
          position: 3,
          structureId: 2,
        },
      ];

      mockPrismaService.songs_lyrics.findUnique
        .mockResolvedValueOnce(mockLyrics[0])
        .mockResolvedValueOnce(mockLyrics[1])
        .mockResolvedValueOnce(mockLyrics[2]);

      mockLyricsNormalizer.normalize
        .mockReturnValueOnce('Amazing grace')
        .mockReturnValueOnce('How sweet the sound')
        .mockReturnValueOnce('That saved a wretch like me');

      mockPrismaService.songs_lyrics.update
        .mockResolvedValueOnce({ ...mockLyrics[0], lyrics: 'Amazing grace' })
        .mockResolvedValueOnce({
          ...mockLyrics[1],
          lyrics: 'How sweet the sound',
        })
        .mockResolvedValueOnce({
          ...mockLyrics[2],
          lyrics: 'That saved a wretch like me',
        });

      const result = await service.normalizeLyrics(songId, lyricIds);

      expect(result.message).toBe('Normalized 3 of 3 lyrics');
      expect(result.results.success).toEqual([1, 2, 3]);
      expect(result.results.failed).toEqual([]);
      expect(result.results.notFound).toEqual([]);
      expect(mockLyricsNormalizer.normalize).toHaveBeenCalledTimes(3);
      expect(mockPrismaService.songs_lyrics.update).toHaveBeenCalledTimes(3);
    });

    it('should handle non-existent lyrics', async () => {
      const songId = 1;
      const lyricIds = [1, 2, 999];

      mockPrismaService.songs_lyrics.findUnique
        .mockResolvedValueOnce({
          id: 1,
          songId: 1,
          lyrics: 'test',
          position: 1,
          structureId: 2,
        })
        .mockResolvedValueOnce({
          id: 2,
          songId: 1,
          lyrics: 'test2',
          position: 2,
          structureId: 2,
        })
        .mockResolvedValueOnce(null);

      mockLyricsNormalizer.normalize
        .mockReturnValueOnce('Test')
        .mockReturnValueOnce('Test2');

      mockPrismaService.songs_lyrics.update
        .mockResolvedValueOnce({
          id: 1,
          songId: 1,
          lyrics: 'Test',
          position: 1,
          structureId: 2,
        })
        .mockResolvedValueOnce({
          id: 2,
          songId: 1,
          lyrics: 'Test2',
          position: 2,
          structureId: 2,
        });

      const result = await service.normalizeLyrics(songId, lyricIds);

      expect(result.message).toBe('Normalized 2 of 3 lyrics');
      expect(result.results.success).toEqual([1, 2]);
      expect(result.results.notFound).toEqual([999]);
      expect(result.results.failed).toEqual([]);
    });

    it('should handle errors during normalization', async () => {
      const songId = 1;
      const lyricIds = [1, 2];

      mockPrismaService.songs_lyrics.findUnique
        .mockResolvedValueOnce({
          id: 1,
          songId: 1,
          lyrics: 'test',
          position: 1,
          structureId: 2,
        })
        .mockResolvedValueOnce({
          id: 2,
          songId: 1,
          lyrics: 'test2',
          position: 2,
          structureId: 2,
        });

      mockLyricsNormalizer.normalize
        .mockReturnValueOnce('Test')
        .mockReturnValueOnce('Test2');

      mockPrismaService.songs_lyrics.update
        .mockResolvedValueOnce({
          id: 1,
          songId: 1,
          lyrics: 'Test',
          position: 1,
          structureId: 2,
        })
        .mockRejectedValueOnce(new Error('Database connection failed'));

      const result = await service.normalizeLyrics(songId, lyricIds);

      expect(result.message).toBe('Normalized 1 of 2 lyrics');
      expect(result.results.success).toEqual([1]);
      expect(result.results.failed).toEqual([
        { id: 2, error: 'Database connection failed' },
      ]);
      expect(result.results.notFound).toEqual([]);
    });

    it('should handle empty lyric IDs array', async () => {
      const songId = 1;
      const lyricIds: number[] = [];

      const result = await service.normalizeLyrics(songId, lyricIds);

      expect(result.message).toBe('Normalized 0 of 0 lyrics');
      expect(result.results.success).toEqual([]);
      expect(result.results.failed).toEqual([]);
      expect(result.results.notFound).toEqual([]);
      expect(mockPrismaService.songs_lyrics.findUnique).not.toHaveBeenCalled();
    });

    it('should normalize divine words correctly', async () => {
      const songId = 1;
      const lyricIds = [1];

      mockPrismaService.songs_lyrics.findUnique.mockResolvedValueOnce({
        id: 1,
        songId: 1,
        lyrics: 'dios es amor y jesus es señor',
        position: 1,
        structureId: 2,
      });

      mockLyricsNormalizer.normalize.mockReturnValueOnce(
        'Dios es amor y Jesús es Señor',
      );

      mockPrismaService.songs_lyrics.update.mockResolvedValueOnce({
        id: 1,
        songId: 1,
        lyrics: 'Dios es amor y Jesús es Señor',
        position: 1,
        structureId: 2,
      });

      const result = await service.normalizeLyrics(songId, lyricIds);

      expect(result.message).toBe('Normalized 1 of 1 lyrics');
      expect(result.results.success).toEqual([1]);
      expect(mockLyricsNormalizer.normalize).toHaveBeenCalledWith(
        'dios es amor y jesus es señor',
      );
    });
  });
});
