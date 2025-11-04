import { Test, TestingModule } from '@nestjs/testing';
import { ChurchRolesController } from './church-roles.controller';
import { ChurchRolesService } from './church-roles.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';

describe('ChurchRolesController', () => {
  let controller: ChurchRolesController;
  let service: ChurchRolesService;

  const mockChurchRolesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChurchRolesController],
      providers: [
        {
          provide: ChurchRolesService,
          useValue: mockChurchRolesService,
        },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ChurchRolesController>(ChurchRolesController);
    service = module.get<ChurchRolesService>(ChurchRolesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have ChurchRolesService defined', () => {
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
