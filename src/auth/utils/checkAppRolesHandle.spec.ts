import { checkAppRolesHandle } from './checkAppRolesHandle';
import { JwtPayload } from '../services/jwt.service';
import { ForbiddenException } from '@nestjs/common';

describe('checkAppRolesHandle', () => {
  const mockUserPayload = (roles: number[] = []): JwtPayload =>
    ({
      sub: 1,
      email: 'test@test.com',
      name: 'Test User',
      roles,
      memberships: [],
      membersofBands: [],
    }) as JwtPayload;

  describe('Role validation', () => {
    it('should not throw when user has required role', () => {
      const userPayload = mockUserPayload([1, 2, 3]);

      expect(() => {
        checkAppRolesHandle([2], userPayload);
      }).not.toThrow();
    });

    it('should not throw when user has one of multiple required roles', () => {
      const userPayload = mockUserPayload([1, 2, 3]);

      expect(() => {
        checkAppRolesHandle([4, 5, 2, 6], userPayload);
      }).not.toThrow();
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      const userPayload = mockUserPayload([1, 2, 3]);

      expect(() => {
        checkAppRolesHandle([4], userPayload);
      }).toThrow(ForbiddenException);

      expect(() => {
        checkAppRolesHandle([4], userPayload);
      }).toThrow('User does not have the required role.');
    });

    it('should throw when user does not have any of multiple required roles', () => {
      const userPayload = mockUserPayload([1, 2, 3]);

      expect(() => {
        checkAppRolesHandle([4, 5, 6], userPayload);
      }).toThrow(ForbiddenException);
    });

    it('should throw when user has no roles', () => {
      const userPayload = mockUserPayload([]);

      expect(() => {
        checkAppRolesHandle([1], userPayload);
      }).toThrow(ForbiddenException);
    });

    it('should not throw when appRoles is undefined', () => {
      const userPayload = mockUserPayload([1, 2, 3]);

      expect(() => {
        checkAppRolesHandle(undefined, userPayload);
      }).not.toThrow();
    });

    it('should not throw when appRoles is null', () => {
      const userPayload = mockUserPayload([1, 2, 3]);

      expect(() => {
        checkAppRolesHandle(null, userPayload);
      }).not.toThrow();
    });

    it('should throw when appRoles is empty array', () => {
      const userPayload = mockUserPayload([1, 2, 3]);

      expect(() => {
        checkAppRolesHandle([], userPayload);
      }).toThrow(ForbiddenException);
    });

    it('should handle edge case with role ID 0', () => {
      const userPayload = mockUserPayload([0, 1, 2]);

      expect(() => {
        checkAppRolesHandle([0], userPayload);
      }).not.toThrow();
    });

    it('should throw when checking for role ID 0 but user does not have it', () => {
      const userPayload = mockUserPayload([1, 2, 3]);

      expect(() => {
        checkAppRolesHandle([0], userPayload);
      }).toThrow(ForbiddenException);
    });
  });
});
