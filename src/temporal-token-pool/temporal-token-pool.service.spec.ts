import { Test, TestingModule } from '@nestjs/testing';
import { TemporalTokenPoolService } from './temporal-token-pool.service';
import { PrismaService } from '../prisma.service';

describe('TemporalTokenPoolService', () => {
  let service: TemporalTokenPoolService;
  let prisma: PrismaService;

  const mockPrismaService = {
    temporal_token_pool: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemporalTokenPoolService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TemporalTokenPoolService>(TemporalTokenPoolService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
