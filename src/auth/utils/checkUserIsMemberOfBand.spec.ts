import { isMemberOfBand } from './checkUserIsMemberOfBand';
import { JwtPayload } from '../services/jwt.service';
import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

describe('isMemberOfBand', () => {
  const mockRequest = (params: any = {}, body: any = {}) =>
    ({
      params,
      body,
    }) as unknown as Request;

  const mockUserPayload = (membersofBands: any[] = []): JwtPayload =>
    ({
      sub: 1,
      email: 'test@test.com',
      name: 'Test User',
      roles: [],
      memberships: [],
      membersofBands,
    }) as JwtPayload;

  describe('Member validation', () => {
    it('should return true when user is a member of the band (paramBandId)', () => {
      const userPayload = mockUserPayload([
        {
          id: 1,
          role: 'guitarist',
          isAdmin: false,
          isEventManager: false,
          band: { id: 10, name: 'Test Band' },
        },
      ]);

      const request = mockRequest({ bandId: '10' });

      const result = isMemberOfBand(
        { checkBy: 'paramBandId', key: 'bandId', isAdmin: false },
        userPayload,
        request,
      );

      expect(result).toBe(true);
    });

    it('should return true when user is a member of the band (bodyBandId)', () => {
      const userPayload = mockUserPayload([
        {
          id: 1,
          role: 'vocalist',
          isAdmin: false,
          isEventManager: false,
          band: { id: 20, name: 'Another Band' },
        },
      ]);

      const request = mockRequest({}, { bandId: '20' });

      const result = isMemberOfBand(
        { checkBy: 'bodyBandId', key: 'bandId', isAdmin: false },
        userPayload,
        request,
      );

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not a member', () => {
      const userPayload = mockUserPayload([
        {
          id: 1,
          role: 'drummer',
          isAdmin: false,
          isEventManager: false,
          band: { id: 10, name: 'Test Band' },
        },
      ]);

      const request = mockRequest({ bandId: '999' });

      expect(() =>
        isMemberOfBand(
          { checkBy: 'paramBandId', key: 'bandId', isAdmin: false },
          userPayload,
          request,
        ),
      ).toThrow(ForbiddenException);

      expect(() =>
        isMemberOfBand(
          { checkBy: 'paramBandId', key: 'bandId', isAdmin: false },
          userPayload,
          request,
        ),
      ).toThrow('User is not a member of the band.');
    });

    it('should throw ForbiddenException when user has no bands', () => {
      const userPayload = mockUserPayload([]);

      const request = mockRequest({ bandId: '10' });

      expect(() =>
        isMemberOfBand(
          { checkBy: 'paramBandId', key: 'bandId', isAdmin: false },
          userPayload,
          request,
        ),
      ).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when membersofBands is undefined', () => {
      const userPayload = {
        ...mockUserPayload([]),
        membersofBands: undefined,
      } as JwtPayload;

      const request = mockRequest({ bandId: '10' });

      expect(() =>
        isMemberOfBand(
          { checkBy: 'paramBandId', key: 'bandId', isAdmin: false },
          userPayload,
          request,
        ),
      ).toThrow(ForbiddenException);
    });
  });

  describe('Admin validation', () => {
    it('should return true when user is admin of the band', () => {
      const userPayload = mockUserPayload([
        {
          id: 1,
          role: 'leader',
          isAdmin: true,
          isEventManager: false,
          band: { id: 10, name: 'Test Band' },
        },
      ]);

      const request = mockRequest({ bandId: '10' });

      const result = isMemberOfBand(
        { checkBy: 'paramBandId', key: 'bandId', isAdmin: true },
        userPayload,
        request,
      );

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is member but not admin', () => {
      const userPayload = mockUserPayload([
        {
          id: 1,
          role: 'guitarist',
          isAdmin: false,
          isEventManager: false,
          band: { id: 10, name: 'Test Band' },
        },
      ]);

      const request = mockRequest({ bandId: '10' });

      expect(() =>
        isMemberOfBand(
          { checkBy: 'paramBandId', key: 'bandId', isAdmin: true },
          userPayload,
          request,
        ),
      ).toThrow(ForbiddenException);

      expect(() =>
        isMemberOfBand(
          { checkBy: 'paramBandId', key: 'bandId', isAdmin: true },
          userPayload,
          request,
        ),
      ).toThrow('User is not an admin of the band.');
    });

    it('should work with multiple bands - user is admin in correct band', () => {
      const userPayload = mockUserPayload([
        {
          id: 1,
          role: 'member',
          isAdmin: false,
          isEventManager: false,
          band: { id: 10, name: 'Band 1' },
        },
        {
          id: 2,
          role: 'leader',
          isAdmin: true,
          isEventManager: false,
          band: { id: 20, name: 'Band 2' },
        },
        {
          id: 3,
          role: 'member',
          isAdmin: false,
          isEventManager: false,
          band: { id: 30, name: 'Band 3' },
        },
      ]);

      const request = mockRequest({ bandId: '20' });

      const result = isMemberOfBand(
        { checkBy: 'paramBandId', key: 'bandId', isAdmin: true },
        userPayload,
        request,
      );

      expect(result).toBe(true);
    });

    it('should throw when user is in multiple bands but not admin in requested band', () => {
      const userPayload = mockUserPayload([
        {
          id: 1,
          role: 'leader',
          isAdmin: true,
          isEventManager: false,
          band: { id: 10, name: 'Band 1' },
        },
        {
          id: 2,
          role: 'member',
          isAdmin: false,
          isEventManager: false,
          band: { id: 20, name: 'Band 2' },
        },
      ]);

      const request = mockRequest({ bandId: '20' });

      expect(() =>
        isMemberOfBand(
          { checkBy: 'paramBandId', key: 'bandId', isAdmin: true },
          userPayload,
          request,
        ),
      ).toThrow('User is not an admin of the band.');
    });
  });

  describe('Edge cases', () => {
    it('should return true when checkUserIsMemberOfBand is undefined', () => {
      const userPayload = mockUserPayload([]);
      const request = mockRequest({ bandId: '10' });

      const result = isMemberOfBand(undefined, userPayload, request);

      expect(result).toBe(true);
    });

    it('should return true when checkUserIsMemberOfBand is null', () => {
      const userPayload = mockUserPayload([]);
      const request = mockRequest({ bandId: '10' });

      const result = isMemberOfBand(null, userPayload, request);

      expect(result).toBe(true);
    });

    it('should handle bandId as number in params', () => {
      const userPayload = mockUserPayload([
        {
          id: 1,
          role: 'member',
          isAdmin: false,
          isEventManager: false,
          band: { id: 10, name: 'Test Band' },
        },
      ]);

      const request = mockRequest({ bandId: 10 }); // Number instead of string

      const result = isMemberOfBand(
        { checkBy: 'paramBandId', key: 'bandId', isAdmin: false },
        userPayload,
        request,
      );

      expect(result).toBe(true);
    });

    it('should handle different key names', () => {
      const userPayload = mockUserPayload([
        {
          id: 1,
          role: 'member',
          isAdmin: false,
          isEventManager: false,
          band: { id: 10, name: 'Test Band' },
        },
      ]);

      const request = mockRequest({ customBandParam: '10' });

      const result = isMemberOfBand(
        { checkBy: 'paramBandId', key: 'customBandParam', isAdmin: false },
        userPayload,
        request,
      );

      expect(result).toBe(true);
    });
  });
});
