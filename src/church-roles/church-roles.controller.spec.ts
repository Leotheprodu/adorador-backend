import { Test, TestingModule } from '@nestjs/testing';
import { ChurchRolesController } from './church-roles.controller';
import { ChurchRolesService } from './church-roles.service';

describe('ChurchRolesController', () => {
  let controller: ChurchRolesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChurchRolesController],
      providers: [ChurchRolesService],
    }).compile();

    controller = module.get<ChurchRolesController>(ChurchRolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
