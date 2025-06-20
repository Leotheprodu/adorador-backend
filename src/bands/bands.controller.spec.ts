import { Test, TestingModule } from '@nestjs/testing';
import { BandsController } from './bands.controller';

describe('BandsController', () => {
  let controller: BandsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BandsController],
    }).compile();

    controller = module.get<BandsController>(BandsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
