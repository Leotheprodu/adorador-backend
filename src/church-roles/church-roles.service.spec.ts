import { Test, TestingModule } from '@nestjs/testing';
import { ChurchRolesService } from './church-roles.service';

describe('ChurchRolesService', () => {
  let service: ChurchRolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChurchRolesService],
    }).compile();

    service = module.get<ChurchRolesService>(ChurchRolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
