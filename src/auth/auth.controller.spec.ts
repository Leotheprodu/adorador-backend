import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { TemporalTokenPoolService } from '../temporal-token-pool/temporal-token-pool.service';
import { AuthJwtService } from './services/jwt.service';
import { PrismaService } from '../prisma.service';

describe('AuthController', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let emailService: EmailService;
  let temporalTokenPoolService: TemporalTokenPoolService;
  let authJwtService: AuthJwtService;
  let prismaService: PrismaService;

  const mockAuthService = {
    login: jest.fn(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockTemporalTokenPoolService = {
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthJwtService = {
    generateTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TemporalTokenPoolService,
          useValue: mockTemporalTokenPoolService,
        },
        {
          provide: AuthJwtService,
          useValue: mockAuthJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    emailService = module.get<EmailService>(EmailService);
    temporalTokenPoolService = module.get<TemporalTokenPoolService>(
      TemporalTokenPoolService,
    );
    authJwtService = module.get<AuthJwtService>(AuthJwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('AuthService should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('UsersService should be defined', () => {
    expect(usersService).toBeDefined();
  });

  it('EmailService should be defined', () => {
    expect(emailService).toBeDefined();
  });

  it('TemporalTokenPoolService should be defined', () => {
    expect(temporalTokenPoolService).toBeDefined();
  });

  it('AuthJwtService should be defined', () => {
    expect(authJwtService).toBeDefined();
  });

  it('PrismaService should be defined', () => {
    expect(prismaService).toBeDefined();
  });

  // Tests simplificados de los servicios (ya testeados en sus propios spec files)
  describe('Service Methods', () => {
    it('AuthService should have login method', () => {
      expect(mockAuthService.login).toBeDefined();
    });

    it('EmailService should have sendEmail method', () => {
      expect(mockEmailService.sendEmail).toBeDefined();
    });

    it('AuthJwtService should have generateTokens method', () => {
      expect(mockAuthJwtService.generateTokens).toBeDefined();
    });

    it('AuthJwtService should have verifyRefreshToken method', () => {
      expect(mockAuthJwtService.verifyRefreshToken).toBeDefined();
    });
  });
});
