import { Test, TestingModule } from '@nestjs/testing';
import { ChurchMemberRolesController } from './church-member-roles.controller';
import { ChurchMemberRolesService } from './church-member-roles.service';

describe('ChurchMemberRolesController', () => {
  let controller: ChurchMemberRolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChurchMemberRolesController],
      providers: [ChurchMemberRolesService],
    }).compile();

    controller = module.get<ChurchMemberRolesController>(ChurchMemberRolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
