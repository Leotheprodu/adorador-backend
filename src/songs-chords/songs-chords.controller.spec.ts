import { Test, TestingModule } from '@nestjs/testing';
import { SongsChordsController } from './songs-chords.controller';
import { SongsChordsService } from './songs-chords.service';
import { SongsService } from '../songs/songs.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';

describe('SongsChordsController', () => {
  let controller: SongsChordsController;
  let service: SongsChordsService;

  const mockSongsChordsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSongsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsChordsController],
      providers: [
        {
          provide: SongsChordsService,
          useValue: mockSongsChordsService,
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

    controller = module.get<SongsChordsController>(SongsChordsController);
    service = module.get<SongsChordsService>(SongsChordsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have SongsChordsService defined', () => {
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

  it('should have remove method', () => {
    expect(controller.remove).toBeDefined();
  });
});
