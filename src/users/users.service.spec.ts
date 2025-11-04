import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { TemporalTokenPoolService } from '../temporal-token-pool/temporal-token-pool.service';

// Mock the password utilities
jest.mock('./utils/handlePassword', () => ({
  passwordEncrypt: jest.fn().mockResolvedValue('hashedPassword123'),
  passwordCompare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let temporalTokenService: TemporalTokenPoolService;

  const mockPrismaService = {
    users: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockTemporalTokenService = {
    createToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TemporalTokenPoolService,
          useValue: mockTemporalTokenService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    temporalTokenService = module.get<TemporalTokenPoolService>(
      TemporalTokenPoolService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return all users with includes', async () => {
      const mockUsers = [
        {
          id: 1,
          name: 'Test User',
          email: 'test@test.com',
          phone: '+123456789',
          status: 'active',
          roles: [],
          memberships: [],
          membersofBands: [],
        },
      ];

      mockPrismaService.users.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsers();

      expect(result).toEqual(mockUsers);
      expect(prismaService.users.findMany).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create a user with encrypted password and verification token', async () => {
      const createDto = {
        name: 'New User',
        email: 'new@test.com',
        phone: '+123456789',
        password: 'plainPassword',
        birthdate: '1990-01-01',
        status: 'inactive' as 'active' | 'inactive',
      };

      const mockCreatedUser = {
        id: 1,
        name: 'New User',
        email: 'new@test.com',
        phone: '+123456789',
        status: 'inactive',
      };

      mockPrismaService.users.create.mockResolvedValue(mockCreatedUser);
      mockTemporalTokenService.createToken.mockResolvedValue({});

      const result = await service.createUser(createDto);

      expect(result).toHaveProperty('verificationToken');
      expect(result).toHaveProperty('message');
      expect(prismaService.users.create).toHaveBeenCalled();
      expect(temporalTokenService.createToken).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return a user by id with includes', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        phone: '+123456789',
        roles: [],
        memberships: [],
        membersofBands: [],
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUser(1);

      expect(result).toEqual(mockUser);
      expect(prismaService.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
      };

      mockPrismaService.users.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser(1);

      expect(result).toEqual(mockUser);
      expect(prismaService.users.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const updateDto = {
        name: 'Updated Name',
        email: 'updated@test.com',
        phone: '+987654321',
        password: 'newPassword',
        birthdate: '1990-01-01',
        status: 'active' as 'active' | 'inactive',
      };

      const mockUser = {
        id: 1,
        ...updateDto,
      };

      mockPrismaService.users.update.mockResolvedValue(mockUser);

      const result = await service.updateUser(1, updateDto);

      expect(result).toEqual(mockUser);
      expect(prismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });
  });

  describe('addRole', () => {
    it('should add a role to a user', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        roles: [{ id: 2 }],
      };

      mockPrismaService.users.update.mockResolvedValue(mockUser);

      const result = await service.addRole(1, 2);

      expect(result).toEqual(mockUser);
      expect(prismaService.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: {
            roles: {
              connect: { id: 2 },
            },
          },
        }),
      );
    });
  });

  describe('removeRole', () => {
    it('should remove a role from a user', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        roles: [],
      };

      mockPrismaService.users.update.mockResolvedValue(mockUser);

      const result = await service.removeRole(1, 2);

      expect(result).toEqual(mockUser);
      expect(prismaService.users.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: {
            roles: {
              disconnect: { id: 2 },
            },
          },
        }),
      );
    });
  });

  describe('activateUserByPhone', () => {
    it('should activate a user by phone', async () => {
      const mockUser = {
        id: 1,
        phone: '+123456789',
        status: 'active',
      };

      mockPrismaService.users.update.mockResolvedValue(mockUser);

      const result = await service.activateUserByPhone('+123456789');

      expect(result).toEqual(mockUser);
      expect(prismaService.users.update).toHaveBeenCalledWith({
        where: { phone: '+123456789' },
        data: { status: 'active' },
      });
    });
  });

  describe('findByPhone', () => {
    it('should find a user by phone', async () => {
      const mockUser = {
        id: 1,
        phone: '+123456789',
        email: 'test@test.com',
        status: 'active',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByPhone('+123456789');

      expect(result).toEqual(mockUser);
      expect(prismaService.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phone: '+123456789' },
        }),
      );
    });
  });

  describe('updatePassword', () => {
    it('should update user password with encryption', async () => {
      const mockUser = {
        id: 1,
        phone: '+123456789',
        password: 'hashedPassword123',
      };

      mockPrismaService.users.update.mockResolvedValue(mockUser);

      const result = await service.updatePassword('+123456789', 'newPassword');

      expect(result).toEqual(mockUser);
      expect(prismaService.users.update).toHaveBeenCalledWith({
        where: { phone: '+123456789' },
        data: { password: 'hashedPassword123' },
      });
    });
  });
});
