import { checkChurchHandle } from './checkChurchHandle';
import { JwtPayload, UserMembership } from '../services/jwt.service';
import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { MembershipsService } from '../../memberships/memberships.service';

describe('checkChurchHandle', () => {
  let mockMembershipsService: jest.Mocked<MembershipsService>;

  const mockRequest = (params: any = {}, body: any = {}) =>
    ({
      params,
      body,
    }) as unknown as Request;

  const mockUserPayload = (memberships: UserMembership[] = []): JwtPayload =>
    ({
      sub: 1,
      email: 'test@test.com',
      name: 'Test User',
      roles: [],
      memberships,
      membersofBands: [],
    }) as JwtPayload;

  const createMembership = (
    churchId: number,
    churchName: string,
    roles: { id: number; name: string; churchRoleId: number }[] = [],
  ): UserMembership => ({
    id: 1,
    church: { id: churchId, name: churchName },
    roles,
    since: new Date(),
  });

  beforeEach(() => {
    mockMembershipsService = {
      findOne: jest.fn(),
    } as any;
  });

  describe('paramChurchId validation', () => {
    it('should not throw when user is member of the church', async () => {
      const membership = createMembership(10, 'Test Church');
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(
          { checkBy: 'paramChurchId', key: 'churchId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when user is not member of the church', async () => {
      const membership = createMembership(10, 'Test Church');
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ churchId: '999' });

      await expect(
        checkChurchHandle(
          { checkBy: 'paramChurchId', key: 'churchId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        checkChurchHandle(
          { checkBy: 'paramChurchId', key: 'churchId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).rejects.toThrow('Church does not belong to the user authenticated.');
    });

    it('should throw when user has no memberships', async () => {
      const userPayload = mockUserPayload([]);
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(
          { checkBy: 'paramChurchId', key: 'churchId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).rejects.toThrow('User does not have memberships.');
    });

    it('should work with multiple memberships', async () => {
      const memberships = [
        createMembership(10, 'Church 1'),
        createMembership(20, 'Church 2'),
        createMembership(30, 'Church 3'),
      ];
      const userPayload = mockUserPayload(memberships);
      const request = mockRequest({ churchId: '20' });

      await expect(
        checkChurchHandle(
          { checkBy: 'paramChurchId', key: 'churchId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('bodyChurchId validation', () => {
    it('should not throw when user is member of the church from body', async () => {
      const membership = createMembership(10, 'Test Church');
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({}, { churchId: '10' });

      await expect(
        checkChurchHandle(
          { checkBy: 'bodyChurchId', key: 'churchId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });

    it('should throw when user is not member of church from body', async () => {
      const membership = createMembership(10, 'Test Church');
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({}, { churchId: '999' });

      await expect(
        checkChurchHandle(
          { checkBy: 'bodyChurchId', key: 'churchId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('paramMembershipId validation', () => {
    it('should not throw when membership belongs to user church', async () => {
      const membership = createMembership(10, 'Test Church');
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ membershipId: '123' });

      mockMembershipsService.findOne.mockResolvedValue({
        id: 123,
        churchId: 10,
        userId: 1,
        active: true,
      } as any);

      await expect(
        checkChurchHandle(
          { checkBy: 'paramMembershipId', key: 'membershipId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();

      expect(mockMembershipsService.findOne).toHaveBeenCalledWith(123);
    });

    it('should throw when membership church does not match user churches', async () => {
      const membership = createMembership(10, 'Test Church');
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ membershipId: '123' });

      mockMembershipsService.findOne.mockResolvedValue({
        id: 123,
        churchId: 999,
        userId: 1,
        active: true,
      } as any);

      await expect(
        checkChurchHandle(
          { checkBy: 'paramMembershipId', key: 'membershipId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).rejects.toThrow('Church does not belong to the user authenticated.');
    });
  });

  describe('Church roles bypass', () => {
    it('should not throw when user has bypass role', async () => {
      const membership = createMembership(10, 'Test Church', [
        { id: 1, name: 'Pastor', churchRoleId: 5 },
      ]);
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(
          {
            checkBy: 'paramChurchId',
            key: 'churchId',
            churchRolesBypass: [5],
          },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });

    it('should not throw when user has one of multiple bypass roles', async () => {
      const membership = createMembership(10, 'Test Church', [
        { id: 1, name: 'Leader', churchRoleId: 3 },
      ]);
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(
          {
            checkBy: 'paramChurchId',
            key: 'churchId',
            churchRolesBypass: [1, 2, 3, 4],
          },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });

    it('should throw when churchRoleStrict is true and user does not have bypass role', async () => {
      const membership = createMembership(10, 'Test Church', [
        { id: 1, name: 'Member', churchRoleId: 1 },
      ]);
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(
          {
            checkBy: 'paramChurchId',
            key: 'churchId',
            churchRolesBypass: [5],
            churchRoleStrict: true,
          },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).rejects.toThrow('User does not have the required role in the church.');
    });

    it('should not throw when churchRoleStrict is false and user does not have bypass role', async () => {
      const membership = createMembership(10, 'Test Church', [
        { id: 1, name: 'Member', churchRoleId: 1 },
      ]);
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(
          {
            checkBy: 'paramChurchId',
            key: 'churchId',
            churchRolesBypass: [5],
            churchRoleStrict: false,
          },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });

    it('should work with bypass roles for bodyChurchId', async () => {
      const membership = createMembership(10, 'Test Church', [
        { id: 1, name: 'Pastor', churchRoleId: 5 },
      ]);
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({}, { churchId: '10' });

      await expect(
        checkChurchHandle(
          {
            checkBy: 'bodyChurchId',
            key: 'churchId',
            churchRolesBypass: [5],
          },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });

    it('should work with bypass roles for paramMembershipId', async () => {
      const membership = createMembership(10, 'Test Church', [
        { id: 1, name: 'Pastor', churchRoleId: 5 },
      ]);
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ membershipId: '123' });

      mockMembershipsService.findOne.mockResolvedValue({
        id: 123,
        churchId: 10,
        userId: 1,
        active: true,
      } as any);

      await expect(
        checkChurchHandle(
          {
            checkBy: 'paramMembershipId',
            key: 'membershipId',
            churchRolesBypass: [5],
          },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should not throw when checkChurch is undefined', async () => {
      const userPayload = mockUserPayload([]);
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(
          undefined,
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });

    it('should not throw when checkChurch is null', async () => {
      const userPayload = mockUserPayload([]);
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(null, userPayload, request, mockMembershipsService),
      ).resolves.not.toThrow();
    });

    it('should throw when memberships is undefined in payload', async () => {
      const userPayload = {
        ...mockUserPayload([]),
        memberships: undefined,
      } as any;
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(
          { checkBy: 'paramChurchId', key: 'churchId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).rejects.toThrow('User does not have memberships.');
    });

    it('should handle numeric churchId in params', async () => {
      const membership = createMembership(10, 'Test Church');
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ churchId: 10 });

      await expect(
        checkChurchHandle(
          { checkBy: 'paramChurchId', key: 'churchId' },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });

    it('should handle user with multiple roles in same church', async () => {
      const membership = createMembership(10, 'Test Church', [
        { id: 1, name: 'Member', churchRoleId: 1 },
        { id: 2, name: 'Leader', churchRoleId: 2 },
        { id: 3, name: 'Pastor', churchRoleId: 5 },
      ]);
      const userPayload = mockUserPayload([membership]);
      const request = mockRequest({ churchId: '10' });

      await expect(
        checkChurchHandle(
          {
            checkBy: 'paramChurchId',
            key: 'churchId',
            churchRolesBypass: [5],
          },
          userPayload,
          request,
          mockMembershipsService,
        ),
      ).resolves.not.toThrow();
    });
  });
});
