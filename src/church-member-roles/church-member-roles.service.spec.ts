import { Test, TestingModule } from '@nestjs/testing';
import { ChurchMemberRolesService } from './church-member-roles.service';

describe('ChurchMemberRolesService', () => {
  let service: ChurchMemberRolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChurchMemberRolesService],
    }).compile();

    service = module.get<ChurchMemberRolesService>(ChurchMemberRolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
