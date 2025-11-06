import { checkUserIdParamHandle } from './checkUserIdParamHandle';
import { JwtPayload } from '../services/jwt.service';
import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

describe('checkUserIdParamHandle', () => {
  const mockRequest = (params: any = {}) =>
    ({
      params,
    }) as unknown as Request;

  const mockUserPayload = (userId: number): JwtPayload =>
    ({
      sub: userId,
      email: 'test@test.com',
      name: 'Test User',
      roles: [],
      memberships: [],
      membersofBands: [],
    }) as JwtPayload;

  describe('User ID validation', () => {
    it('should not throw when user ID matches param', () => {
      const userPayload = mockUserPayload(123);
      const request = mockRequest({ userId: '123' });

      expect(() => {
        checkUserIdParamHandle('userId', userPayload, request);
      }).not.toThrow();
    });

    it('should throw ForbiddenException when user ID does not match param', () => {
      const userPayload = mockUserPayload(123);
      const request = mockRequest({ userId: '456' });

      expect(() => {
        checkUserIdParamHandle('userId', userPayload, request);
      }).toThrow(ForbiddenException);

      expect(() => {
        checkUserIdParamHandle('userId', userPayload, request);
      }).toThrow('User ID does not match.');
    });

    it('should not throw when param is a number instead of string', () => {
      const userPayload = mockUserPayload(123);
      const request = mockRequest({ userId: 123 });

      expect(() => {
        checkUserIdParamHandle('userId', userPayload, request);
      }).not.toThrow();
    });

    it('should handle different param key names', () => {
      const userPayload = mockUserPayload(999);
      const request = mockRequest({ customUserId: '999' });

      expect(() => {
        checkUserIdParamHandle('customUserId', userPayload, request);
      }).not.toThrow();
    });

    it('should throw when using different param key and IDs do not match', () => {
      const userPayload = mockUserPayload(999);
      const request = mockRequest({ customUserId: '123' });

      expect(() => {
        checkUserIdParamHandle('customUserId', userPayload, request);
      }).toThrow(ForbiddenException);
    });

    it('should not throw when checkUserIdParam is undefined', () => {
      const userPayload = mockUserPayload(123);
      const request = mockRequest({ userId: '456' });

      expect(() => {
        checkUserIdParamHandle(undefined, userPayload, request);
      }).not.toThrow();
    });

    it('should not throw when checkUserIdParam is null', () => {
      const userPayload = mockUserPayload(123);
      const request = mockRequest({ userId: '456' });

      expect(() => {
        checkUserIdParamHandle(null, userPayload, request);
      }).not.toThrow();
    });

    it('should not throw when param does not exist in request', () => {
      const userPayload = mockUserPayload(123);
      const request = mockRequest({ otherParam: '456' });

      expect(() => {
        checkUserIdParamHandle('userId', userPayload, request);
      }).not.toThrow();
    });

    it('should handle user ID as 0', () => {
      const userPayload = mockUserPayload(0);
      const request = mockRequest({ userId: '0' });

      expect(() => {
        checkUserIdParamHandle('userId', userPayload, request);
      }).not.toThrow();
    });

    it('should throw when param is 0 but user ID is different', () => {
      const userPayload = mockUserPayload(123);
      const request = mockRequest({ userId: '0' });

      expect(() => {
        checkUserIdParamHandle('userId', userPayload, request);
      }).toThrow(ForbiddenException);
    });

    it('should handle string with leading zeros', () => {
      const userPayload = mockUserPayload(123);
      const request = mockRequest({ userId: '00123' });

      expect(() => {
        checkUserIdParamHandle('userId', userPayload, request);
      }).not.toThrow();
    });

    it('should throw when param is invalid number string', () => {
      const userPayload = mockUserPayload(123);
      const request = mockRequest({ userId: 'abc' });

      expect(() => {
        checkUserIdParamHandle('userId', userPayload, request);
      }).toThrow(ForbiddenException);
    });
  });
});
