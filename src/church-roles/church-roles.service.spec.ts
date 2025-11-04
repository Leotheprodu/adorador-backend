import { Test, TestingModule } from '@nestjs/testing';
import { ChurchRolesService } from './church-roles.service';
import { PrismaService } from '../prisma.service';

describe('ChurchRolesService', () => {
  let service: ChurchRolesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    churchRoles: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChurchRolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChurchRolesService>(ChurchRolesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a string from create', async () => {
    const result = await service.create({});
    expect(result).toBe('This action adds a new churchRole');
  });

  it('should return a string from findAll', async () => {
    const result = await service.findAll();
    expect(result).toBe('This action returns all churchRoles');
  });

  it('should return a string from findOne', async () => {
    const result = await service.findOne(1);
    expect(result).toBe('This action returns a #1 churchRole');
  });

  it('should return a string from update', async () => {
    const result = await service.update(1, {});
    expect(result).toBe('This action updates a #1 churchRole');
  });

  it('should return a string from remove', async () => {
    const result = await service.remove(1);
    expect(result).toBe('This action removes a #1 churchRole');
  });
});
