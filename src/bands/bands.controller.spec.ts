import { Test, TestingModule } from '@nestjs/testing';
import { BandsController } from './bands.controller';
import { BandsService } from './bands.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';

jest.mock('../auth/guards/permissions/permissions.guard');
jest.mock('../auth/decorators/permissions.decorators');
jest.mock('../auth/decorators/get-user.decorator');
jest.mock('../auth/services/jwt.service');
jest.mock('../chore/utils/catchHandle');
jest.mock('../../config/constants', () => ({
  userRoles: {
    admin: { id: 1 },
  },
}));

describe('BandsController', () => {
  let controller: BandsController;
  let service: any;

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
      controllers: [BandsController],
      providers: [
        { provide: BandsService, useValue: mockService },
        {
          provide: PermissionsGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
      ],
    }).compile();

    controller = module.get<BandsController>(BandsController);
    service = module.get(BandsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBands', () => {
    it('should return bands', async () => {
      const mockBands = [{ id: 1, name: 'Band 1' }];
      service.getBands.mockResolvedValue(mockBands);

      const res = {
        send: jest.fn(),
      };

      await controller.getBands(res as any);

      expect(service.getBands).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(mockBands);
    });
  });

  describe('createBand', () => {
    it('should create a band', async () => {
      const mockBand = { id: 1, name: 'New Band' };
      service.createBand.mockResolvedValue(mockBand);

      const res = {
        send: jest.fn(),
      };
      const body = { name: 'New Band' };

      await controller.createBand(res as any, body);

      expect(service.createBand).toHaveBeenCalledWith(body);
      expect(res.send).toHaveBeenCalledWith(mockBand);
    });
  });

  describe('getBand', () => {
    it('should return a band', async () => {
      const mockBand = { id: 1, name: 'Band 1' };
      service.getBand.mockResolvedValue(mockBand);

      const res = {
        send: jest.fn(),
      };

      await controller.getBand(res as any, 1);

      expect(service.getBand).toHaveBeenCalledWith(1);
      expect(res.send).toHaveBeenCalledWith(mockBand);
    });
  });

  describe('updateBand', () => {
    it('should update a band', async () => {
      const mockBand = { id: 1, name: 'Updated Band' };
      service.updateBand.mockResolvedValue(mockBand);

      const res = {
        send: jest.fn(),
      };
      const body = { name: 'Updated Band' };

      await controller.updateBand(res as any, 1, body);

      expect(service.updateBand).toHaveBeenCalledWith(1, body);
      expect(res.send).toHaveBeenCalledWith(mockBand);
    });
  });

  describe('deleteBand', () => {
    it('should delete a band', async () => {
      service.deleteBand.mockResolvedValue({ id: 1, name: 'Band 1' });

      const res = {
        send: jest.fn(),
      };

      await controller.deleteBand(res as any, 1);

      expect(service.deleteBand).toHaveBeenCalledWith(1);
      expect(res.send).toHaveBeenCalledWith({ message: 'Band id 1 deleted' });
    });
  });
});
