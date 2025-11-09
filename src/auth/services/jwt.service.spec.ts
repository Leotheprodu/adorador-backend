import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthJwtService, JwtPayload } from './jwt.service';

describe('AuthJwtService', () => {
  let service: AuthJwtService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthJwtService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthJwtService>(AuthJwtService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokens', () => {
    const userId = 1;
    const email = 'test@example.com';
    const name = 'Test User';
    const roles = [1, 2];
    const memberships = [
      {
        id: 1,
        church: { id: 1, name: 'Test Church' },
        roles: [{ id: 1, name: 'member', churchRoleId: 1 }],
        since: new Date(),
      },
    ];
    const membersofBands = [
      {
        id: 1,
        role: 'guitarist',
        isAdmin: true,
        isEventManager: false,
        band: { id: 1, name: 'Test Band' },
      },
    ];

    it('should generate access and refresh tokens', () => {
      const mockAccessToken = 'mock.access.token';
      const mockRefreshToken = 'mock.refresh.token';

      mockJwtService.sign
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = service.generateTokens(
        userId,
        email,
        name,
        roles,
        memberships,
        membersofBands,
      );

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should generate access token with 30m expiration', () => {
      mockJwtService.sign.mockReturnValue('mock.token');

      service.generateTokens(
        userId,
        email,
        name,
        roles,
        memberships,
        membersofBands,
      );

      const accessTokenCall = mockJwtService.sign.mock.calls[0];
      expect(accessTokenCall[1]).toMatchObject({
        expiresIn: '30m',
      });
    });

    it('should generate refresh token with 30d expiration', () => {
      mockJwtService.sign.mockReturnValue('mock.token');

      service.generateTokens(
        userId,
        email,
        name,
        roles,
        memberships,
        membersofBands,
      );

      const refreshTokenCall = mockJwtService.sign.mock.calls[1];
      expect(refreshTokenCall[1]).toMatchObject({
        expiresIn: '30d',
      });
    });

    it('should include correct payload in access token', () => {
      mockJwtService.sign.mockReturnValue('mock.token');

      service.generateTokens(
        userId,
        email,
        name,
        roles,
        memberships,
        membersofBands,
      );

      const payload = mockJwtService.sign.mock.calls[0][0];
      expect(payload).toEqual({
        sub: userId,
        email,
        name,
        roles,
        memberships,
        membersofBands,
      });
    });

    it('should include minimal payload in refresh token', () => {
      mockJwtService.sign.mockReturnValue('mock.token');

      service.generateTokens(
        userId,
        email,
        name,
        roles,
        memberships,
        membersofBands,
      );

      const payload = mockJwtService.sign.mock.calls[1][0];
      expect(payload).toEqual({
        sub: userId,
        email,
      });
    });

    it('should use correct secrets for tokens', () => {
      mockJwtService.sign.mockReturnValue('mock.token');

      service.generateTokens(userId, email, name);

      const accessTokenCall = mockJwtService.sign.mock.calls[0];
      const refreshTokenCall = mockJwtService.sign.mock.calls[1];

      expect(accessTokenCall[1].secret).toBe(
        process.env.JWT_ACCESS_SECRET || 'default-access-secret',
      );
      expect(refreshTokenCall[1].secret).toBe(
        process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      );
    });

    it('should handle empty arrays for roles, memberships, and bands', () => {
      mockJwtService.sign.mockReturnValue('mock.token');

      service.generateTokens(userId, email, name);

      const payload = mockJwtService.sign.mock.calls[0][0];
      expect(payload).toEqual({
        sub: userId,
        email,
        name,
        roles: [],
        memberships: [],
        membersofBands: [],
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return access token payload', () => {
      const mockToken = 'mock.access.token';
      const mockPayload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        name: 'Test User',
        roles: [1],
        memberships: [],
        membersofBands: [],
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = service.verifyAccessToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
      });
    });

    it('should use correct secret for verification', () => {
      const mockToken = 'mock.access.token';
      mockJwtService.verify.mockReturnValue({});

      service.verifyAccessToken(mockToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(
        mockToken,
        expect.objectContaining({
          secret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
        }),
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return refresh token payload', () => {
      const mockToken = 'mock.refresh.token';
      const mockPayload = {
        sub: 1,
        email: 'test@example.com',
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = service.verifyRefreshToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      });
    });

    it('should use correct secret for verification', () => {
      const mockToken = 'mock.refresh.token';
      mockJwtService.verify.mockReturnValue({ sub: 1, email: 'test@test.com' });

      service.verifyRefreshToken(mockToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(
        mockToken,
        expect.objectContaining({
          secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        }),
      );
    });
  });

  describe('jwtToSessionFormat', () => {
    it('should convert JWT payload to session format', () => {
      const mockPayload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        name: 'Test User',
        roles: [1, 2],
        memberships: [
          {
            id: 1,
            church: { id: 1, name: 'Test Church' },
            roles: [{ id: 1, name: 'member', churchRoleId: 1 }],
            since: new Date(),
          },
        ],
        membersofBands: [
          {
            id: 1,
            role: 'guitarist',
            isAdmin: true,
            isEventManager: false,
            band: { id: 1, name: 'Test Band' },
          },
        ],
      };

      const session = service.jwtToSessionFormat(mockPayload);

      expect(session).toEqual({
        userId: 1,
        name: 'Test User',
        email: 'test@example.com',
        isLoggedIn: true,
        roles: [1, 2],
        memberships: mockPayload.memberships,
        membersofBands: mockPayload.membersofBands,
      });
    });

    it('should handle empty roles and memberships', () => {
      const mockPayload: JwtPayload = {
        sub: 1,
        email: 'test@example.com',
        name: 'Test User',
        roles: [],
        memberships: [],
        membersofBands: [],
      };

      const session = service.jwtToSessionFormat(mockPayload);

      expect(session).toEqual({
        userId: 1,
        name: 'Test User',
        email: 'test@example.com',
        isLoggedIn: true,
        roles: [],
        memberships: [],
        membersofBands: [],
      });
    });
  });

  describe('Token Duration Regression Tests', () => {
    it('should NEVER change access token duration from 30m', () => {
      mockJwtService.sign.mockReturnValue('mock.token');

      service.generateTokens(1, 'test@test.com', 'Test User');

      const accessTokenOptions = mockJwtService.sign.mock.calls[0][1];
      expect(accessTokenOptions.expiresIn).toBe('30m');
    });

    it('should NEVER change refresh token duration from 30d', () => {
      mockJwtService.sign.mockReturnValue('mock.token');

      service.generateTokens(1, 'test@test.com', 'Test User');

      const refreshTokenOptions = mockJwtService.sign.mock.calls[1][1];
      expect(refreshTokenOptions.expiresIn).toBe('30d');
    });
  });
});
