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
    parseAndSaveLyricsWithChords: jest.fn(),
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

  it('should have uploadLyricsWithChordsByFile method', () => {
    expect(controller.uploadLyricsWithChordsByFile).toBeDefined();
  });
});
