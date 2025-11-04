import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailService } from '../email/email.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    getUsers: jest.fn(),
    createUser: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    addRole: jest.fn(),
    removeRole: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have UsersService defined', () => {
    expect(service).toBeDefined();
  });

  it('should have getUsers method', () => {
    expect(controller.getUsers).toBeDefined();
  });

  it('should have createUser method', () => {
    expect(controller.createUser).toBeDefined();
  });

  it('should have getUser method', () => {
    expect(controller.getUser).toBeDefined();
  });

  it('should have updateUser method', () => {
    expect(controller.updateUser).toBeDefined();
  });

  it('should have deleteUser method', () => {
    expect(controller.deleteUser).toBeDefined();
  });

  it('should have addRole method', () => {
    expect(controller.addRole).toBeDefined();
  });

  it('should have removeRole method', () => {
    expect(controller.removeRole).toBeDefined();
  });
});
