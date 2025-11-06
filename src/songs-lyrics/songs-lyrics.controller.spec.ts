import { Test, TestingModule } from '@nestjs/testing';
import { SongsLyricsController } from './songs-lyrics.controller';
import { SongsLyricsService } from './songs-lyrics.service';
import { SongsService } from '../songs/songs.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';

describe('SongsLyricsController', () => {
  let controller: SongsLyricsController;
  let service: SongsLyricsService;

  const mockSongsLyricsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateArrayOfLyrics: jest.fn(),
    remove: jest.fn(),
    removeAllLyrics: jest.fn(),
    parseAndSaveLyricsWithChords: jest.fn(),
    parseAndSaveLyricsFromText: jest.fn(),
    normalizeLyrics: jest.fn(),
  };

  const mockSongsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsLyricsController],
      providers: [
        {
          provide: SongsLyricsService,
          useValue: mockSongsLyricsService,
        },
        {
          provide: SongsService,
          useValue: mockSongsService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SongsLyricsController>(SongsLyricsController);
    service = module.get<SongsLyricsService>(SongsLyricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have SongsLyricsService defined', () => {
    expect(service).toBeDefined();
  });

  it('should have create method', () => {
    expect(controller.create).toBeDefined();
  });

  it('should have findAll method', () => {
    expect(controller.findAll).toBeDefined();
  });

  it('should have findOne method', () => {
    expect(controller.findOne).toBeDefined();
  });

  it('should have update method', () => {
    expect(controller.update).toBeDefined();
  });

  it('should have updateArrayOfLyrics method', () => {
    expect(controller.updateArrayOfLyrics).toBeDefined();
  });

  it('should have remove method', () => {
    expect(controller.remove).toBeDefined();
  });

  it('should have removeAll method', () => {
    expect(controller.removeAll).toBeDefined();
  });

  it('should have uploadLyricsWithChordsByFile method', () => {
    expect(controller.uploadLyricsWithChordsByFile).toBeDefined();
  });

  it('should have parseLyricsFromText method', () => {
    expect(controller.parseLyricsFromText).toBeDefined();
  });

  it('should have normalizeLyrics method', () => {
    expect(controller.normalizeLyrics).toBeDefined();
  });

  describe('parseLyricsFromText', () => {
    it('should parse lyrics from text successfully', async () => {
      const bandId = 1;
      const songId = 1;
      const parseLyricsTextDto = {
        textContent: `[Verse]
C       G
Amazing grace`,
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      mockSongsLyricsService.parseAndSaveLyricsFromText.mockResolvedValue({
        message:
          'Lyrics and chords processed with validated notes and qualities!',
      });

      await controller.parseLyricsFromText(
        parseLyricsTextDto,
        bandId,
        mockResponse,
        songId,
      );

      expect(
        mockSongsLyricsService.parseAndSaveLyricsFromText,
      ).toHaveBeenCalledWith(parseLyricsTextDto.textContent, songId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'Lyrics parsed and saved',
      });
    });

    it('should handle errors during parsing', async () => {
      const bandId = 1;
      const songId = 1;
      const parseLyricsTextDto = {
        textContent: 'Invalid content',
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      mockSongsLyricsService.parseAndSaveLyricsFromText.mockRejectedValue(
        new Error('File validation failed'),
      );

      await expect(
        controller.parseLyricsFromText(
          parseLyricsTextDto,
          bandId,
          mockResponse,
          songId,
        ),
      ).rejects.toThrow();
    });

    it('should handle empty text content', async () => {
      const bandId = 1;
      const songId = 1;
      const parseLyricsTextDto = {
        textContent: '',
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      mockSongsLyricsService.parseAndSaveLyricsFromText.mockResolvedValue({
        message:
          'Lyrics and chords processed with validated notes and qualities!',
      });

      await controller.parseLyricsFromText(
        parseLyricsTextDto,
        bandId,
        mockResponse,
        songId,
      );

      expect(
        mockSongsLyricsService.parseAndSaveLyricsFromText,
      ).toHaveBeenCalledWith('', songId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle multiline text with structures and chords', async () => {
      const bandId = 1;
      const songId = 1;
      const parseLyricsTextDto = {
        textContent: `[Verse]
C       G       Am      F
Amazing grace how sweet the sound

[Chorus]
F       G       C
I once was lost`,
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      mockSongsLyricsService.parseAndSaveLyricsFromText.mockResolvedValue({
        message:
          'Lyrics and chords processed with validated notes and qualities!',
      });

      await controller.parseLyricsFromText(
        parseLyricsTextDto,
        bandId,
        mockResponse,
        songId,
      );

      expect(
        mockSongsLyricsService.parseAndSaveLyricsFromText,
      ).toHaveBeenCalledWith(parseLyricsTextDto.textContent, songId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith({
        message: 'Lyrics parsed and saved',
      });
    });
  });

  describe('removeAll', () => {
    it('should delete all lyrics from a song', async () => {
      const bandId = 1;
      const songId = 1;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      const mockResult = {
        deletedLyrics: 15,
        message: 'Deleted 15 lyrics and their associated chords',
      };

      mockSongsLyricsService.removeAllLyrics.mockResolvedValue(mockResult);

      await controller.removeAll(bandId, songId, mockResponse);

      expect(mockSongsLyricsService.removeAllLyrics).toHaveBeenCalledWith(
        songId,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockResult);
    });

    it('should handle empty song with no lyrics', async () => {
      const bandId = 1;
      const songId = 1;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      const mockResult = {
        deletedLyrics: 0,
        message: 'Deleted 0 lyrics and their associated chords',
      };

      mockSongsLyricsService.removeAllLyrics.mockResolvedValue(mockResult);

      await controller.removeAll(bandId, songId, mockResponse);

      expect(mockSongsLyricsService.removeAllLyrics).toHaveBeenCalledWith(
        songId,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors during deletion', async () => {
      const bandId = 1;
      const songId = 1;
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      mockSongsLyricsService.removeAllLyrics.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.removeAll(bandId, songId, mockResponse),
      ).rejects.toThrow();
    });
  });

  describe('normalizeLyrics', () => {
    it('should normalize lyrics successfully', async () => {
      const bandId = 1;
      const songId = 1;
      const normalizeLyricsDto = {
        lyricIds: [1, 2, 3],
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      const mockResult = {
        message: 'Normalized 3 of 3 lyrics',
        results: {
          success: [1, 2, 3],
          failed: [],
          notFound: [],
        },
      };

      mockSongsLyricsService.normalizeLyrics.mockResolvedValue(mockResult);

      await controller.normalizeLyrics(
        bandId,
        songId,
        normalizeLyricsDto,
        mockResponse,
      );

      expect(mockSongsLyricsService.normalizeLyrics).toHaveBeenCalledWith(
        songId,
        [1, 2, 3],
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockResult);
    });

    it('should handle partial normalization', async () => {
      const bandId = 1;
      const songId = 1;
      const normalizeLyricsDto = {
        lyricIds: [1, 2, 999],
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      const mockResult = {
        message: 'Normalized 2 of 3 lyrics',
        results: {
          success: [1, 2],
          failed: [],
          notFound: [999],
        },
      };

      mockSongsLyricsService.normalizeLyrics.mockResolvedValue(mockResult);

      await controller.normalizeLyrics(
        bandId,
        songId,
        normalizeLyricsDto,
        mockResponse,
      );

      expect(mockSongsLyricsService.normalizeLyrics).toHaveBeenCalledWith(
        songId,
        [1, 2, 999],
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors during normalization', async () => {
      const bandId = 1;
      const songId = 1;
      const normalizeLyricsDto = {
        lyricIds: [1, 2],
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      mockSongsLyricsService.normalizeLyrics.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.normalizeLyrics(
          bandId,
          songId,
          normalizeLyricsDto,
          mockResponse,
        ),
      ).rejects.toThrow();
    });

    it('should handle empty lyricIds array', async () => {
      const bandId = 1;
      const songId = 1;
      const normalizeLyricsDto = {
        lyricIds: [],
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any;

      const mockResult = {
        message: 'Normalized 0 of 0 lyrics',
        results: {
          success: [],
          failed: [],
          notFound: [],
        },
      };

      mockSongsLyricsService.normalizeLyrics.mockResolvedValue(mockResult);

      await controller.normalizeLyrics(
        bandId,
        songId,
        normalizeLyricsDto,
        mockResponse,
      );

      expect(mockSongsLyricsService.normalizeLyrics).toHaveBeenCalledWith(
        songId,
        [],
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockResult);
    });
  });
});
