import { Test, TestingModule } from '@nestjs/testing';
import { TemporalTokenPoolService } from './temporal-token-pool.service';

describe('TemporalTokenPoolService', () => {
  let service: TemporalTokenPoolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemporalTokenPoolService],
    }).compile();

    service = module.get<TemporalTokenPoolService>(TemporalTokenPoolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
