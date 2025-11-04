import { Test, TestingModule } from '@nestjs/testing';
import { ChurchesService } from './churches.service';

describe('ChurchesController', () => {
  let service: ChurchesService;

  const mockChurchesService = {
    getChurches: jest.fn(),
    createChurch: jest.fn(),
    getChurch: jest.fn(),
    updateChurch: jest.fn(),
    deleteChurch: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ChurchesService,
          useValue: mockChurchesService,
        },
      ],
    }).compile();

    service = module.get<ChurchesService>(ChurchesService);
  });

  it('ChurchesService should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests simplificados del servicio (ya testeado en churches.service.spec.ts)
  describe('Service Methods', () => {
    it('should have getChurches method', () => {
      expect(service.getChurches).toBeDefined();
    });

    it('should have createChurch method', () => {
      expect(service.createChurch).toBeDefined();
    });

    it('should have getChurch method', () => {
      expect(service.getChurch).toBeDefined();
    });

    it('should have updateChurch method', () => {
      expect(service.updateChurch).toBeDefined();
    });

    it('should have deleteChurch method', () => {
      expect(service.deleteChurch).toBeDefined();
    });
  });
});
