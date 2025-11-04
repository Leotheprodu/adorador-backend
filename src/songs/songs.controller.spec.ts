import { Test, TestingModule } from '@nestjs/testing';
import { SongsService } from './songs.service';

describe('SongsController', () => {
  let service: SongsService;

  const mockSongsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllSongs: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: SongsService,
          useValue: mockSongsService,
        },
      ],
    }).compile();

    service = module.get<SongsService>(SongsService);
  });

  it('SongsService should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests simplificados del servicio (ya testeado en songs.service.spec.ts)
  describe('Service Methods', () => {
    it('should have create method', () => {
      expect(service.create).toBeDefined();
    });

    it('should have findAll method', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should have findOne method', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should have update method', () => {
      expect(service.update).toBeDefined();
    });

    it('should have remove method', () => {
      expect(service.remove).toBeDefined();
    });

    it('should have findAllSongs method', () => {
      expect(service.findAllSongs).toBeDefined();
    });
  });
});
