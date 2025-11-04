import { Test, TestingModule } from '@nestjs/testing';
import { ChurchMemberRolesController } from './church-member-roles.controller';
import { ChurchMemberRolesService } from './church-member-roles.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';

describe('ChurchMemberRolesController', () => {
  let controller: ChurchMemberRolesController;
  let service: ChurchMemberRolesService;

  const mockChurchMemberRolesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChurchMemberRolesController],
      providers: [
        {
          provide: ChurchMemberRolesService,
          useValue: mockChurchMemberRolesService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ChurchMemberRolesController>(
      ChurchMemberRolesController,
    );
    service = module.get<ChurchMemberRolesService>(ChurchMemberRolesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have ChurchMemberRolesService defined', () => {
    expect(service).toBeDefined();
  });

  it('should have create method', () => {
    expect(controller.create).toBeDefined();
  });

  it('should have findAll method', () => {
    expect(controller.findAll).toBeDefined();
  });

  it('should have findOne method', () => {
    expect(controller.findOne).toBeDefined();
  });

  it('should have update method', () => {
    expect(controller.update).toBeDefined();
  });

  it('should have remove method', () => {
    expect(controller.remove).toBeDefined();
  });
});
