import { checkLoginStatusHandle } from './checkLoginStatusHandle';
import { JwtPayload } from '../services/jwt.service';
import { ForbiddenException } from '@nestjs/common';

describe('checkLoginStatusHandle', () => {
  const mockUserPayload = (): JwtPayload =>
    ({
      sub: 1,
      email: 'test@test.com',
      name: 'Test User',
      roles: [],
      memberships: [],
      membersofBands: [],
    }) as JwtPayload;

  describe('Login status validation', () => {
    describe('loggedIn status', () => {
      it('should not throw when user is logged in and status is loggedIn', () => {
        const userPayload = mockUserPayload();

        expect(() => {
          checkLoginStatusHandle('loggedIn', userPayload);
        }).not.toThrow();
      });

      it('should throw ForbiddenException when user is not logged in and status is loggedIn', () => {
        expect(() => {
          checkLoginStatusHandle('loggedIn', null);
        }).toThrow(ForbiddenException);

        expect(() => {
          checkLoginStatusHandle('loggedIn', null);
        }).toThrow('User is not logged in.');
      });

      it('should throw when user is undefined and status is loggedIn', () => {
        expect(() => {
          checkLoginStatusHandle('loggedIn', undefined);
        }).toThrow(ForbiddenException);
      });
    });

    describe('notLoggedIn status', () => {
      it('should not throw when user is not logged in and status is notLoggedIn', () => {
        expect(() => {
          checkLoginStatusHandle('notLoggedIn', null);
        }).not.toThrow();
      });

      it('should throw ForbiddenException when user is logged in and status is notLoggedIn', () => {
        const userPayload = mockUserPayload();

        expect(() => {
          checkLoginStatusHandle('notLoggedIn', userPayload);
        }).toThrow(ForbiddenException);

        expect(() => {
          checkLoginStatusHandle('notLoggedIn', userPayload);
        }).toThrow('User is already logged in.');
      });
    });

    describe('public status', () => {
      it('should not throw when user is logged in and status is public', () => {
        const userPayload = mockUserPayload();

        expect(() => {
          checkLoginStatusHandle('public' as any, userPayload);
        }).not.toThrow();
      });

      it('should not throw when user is not logged in and status is public', () => {
        expect(() => {
          checkLoginStatusHandle('public' as any, null);
        }).not.toThrow();
      });
    });

    describe('Edge cases', () => {
      it('should not throw when checkLoginStatus is undefined', () => {
        const userPayload = mockUserPayload();

        expect(() => {
          checkLoginStatusHandle(undefined, userPayload);
        }).not.toThrow();
      });

      it('should not throw when checkLoginStatus is null', () => {
        const userPayload = mockUserPayload();

        expect(() => {
          checkLoginStatusHandle(null, userPayload);
        }).not.toThrow();
      });

      it('should not throw when both parameters are undefined', () => {
        expect(() => {
          checkLoginStatusHandle(undefined, undefined);
        }).not.toThrow();
      });
    });
  });
});
