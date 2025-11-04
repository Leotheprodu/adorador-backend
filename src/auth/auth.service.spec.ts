import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as handlePassword from '../users/utils/handlePassword';

// Mock del módulo handlePassword
jest.mock('../users/utils/handlePassword', () => ({
  passwordCompare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;

  const mockUser = {
    id: 1,
    phone: '+1234567890',
    username: 'testuser',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    refreshToken: null,
    memberships: [
      {
        id: 1,
        church: {
          id: 1,
          name: 'Test Church',
        },
        roles: [
          {
            id: 1,
            role: {
              id: 1,
              name: 'member',
            },
          },
        ],
        memberSince: new Date(),
      },
    ],
    roles: [{ id: 1 }],
    membersofBands: [
      {
        id: 1,
        isAdmin: true,
        isEventManager: false,
        role: 'guitarist',
        band: {
          id: 1,
          name: 'Test Band',
        },
      },
    ],
  };

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      phone: '+1234567890',
      password: 'testPassword123',
    };

    it('should return user data when credentials are valid', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUser);
      (handlePassword.passwordCompare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual(mockUser);
      expect(prismaService.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phone: loginDto.phone },
        }),
      );
      expect(handlePassword.passwordCompare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('should return null when user is not found', async () => {
      prismaService.users.findUnique.mockResolvedValue(null);

      const result = await service.login(loginDto);

      expect(result).toBeNull();
      expect(prismaService.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phone: loginDto.phone },
        }),
      );
      expect(handlePassword.passwordCompare).not.toHaveBeenCalled();
    });

    it('should throw HttpException when password is invalid', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUser);
      (handlePassword.passwordCompare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new HttpException('Invalid Password', HttpStatus.UNAUTHORIZED),
      );

      expect(prismaService.users.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { phone: loginDto.phone },
        }),
      );
      expect(handlePassword.passwordCompare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it('should include user memberships, roles and bands in response', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUser);
      (handlePassword.passwordCompare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.memberships).toBeDefined();
      expect(result.memberships).toHaveLength(1);
      expect(result.roles).toBeDefined();
      expect(result.membersofBands).toBeDefined();
      expect(result.membersofBands).toHaveLength(1);
    });
  });
});
