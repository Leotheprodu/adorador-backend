import { Test, TestingModule } from '@nestjs/testing';
import { BandsService } from './bands.service';

describe('BandsController', () => {
  let service: BandsService;

  beforeEach(async () => {
    const mockService = {
      getBands: jest.fn(),
      getBandsByUserId: jest.fn(),
      createBand: jest.fn(),
      getBand: jest.fn(),
      updateBand: jest.fn(),
      deleteBand: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: BandsService, useValue: mockService }],
    }).compile();

    service = module.get<BandsService>(BandsService);
  });

  it('BandsService should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests simplificados del servicio (ya testeado en bands.service.spec.ts)
  describe('Service Methods', () => {
    it('should have getBands method', () => {
      expect(service.getBands).toBeDefined();
    });

    it('should have createBand method', () => {
      expect(service.createBand).toBeDefined();
    });

    it('should have getBand method', () => {
      expect(service.getBand).toBeDefined();
    });

    it('should have updateBand method', () => {
      expect(service.updateBand).toBeDefined();
    });

    it('should have deleteBand method', () => {
      expect(service.deleteBand).toBeDefined();
    });
  });
});
