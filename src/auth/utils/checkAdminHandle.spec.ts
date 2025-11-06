import { checkAdminHandle } from './checkAdminHandle';
import { JwtPayload } from '../services/jwt.service';
import { userRoles } from '../../../config/constants';

describe('checkAdminHandle', () => {
  const mockUserPayload = (roles: number[] = []): JwtPayload =>
    ({
      sub: 1,
      email: 'test@test.com',
      name: 'Test User',
      roles,
      memberships: [],
      membersofBands: [],
    }) as JwtPayload;

  describe('Admin validation', () => {
    it('should return true when user has admin role', () => {
      const userPayload = mockUserPayload([userRoles.admin.id]);

      const result = checkAdminHandle(userPayload);

      expect(result).toBe(true);
    });

    it('should return undefined when user does not have admin role', () => {
      const userPayload = mockUserPayload([2, 3]); // Other roles

      const result = checkAdminHandle(userPayload);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user has no roles', () => {
      const userPayload = mockUserPayload([]);

      const result = checkAdminHandle(userPayload);

      expect(result).toBeUndefined();
    });

    it('should return true when user has admin role among other roles', () => {
      const userPayload = mockUserPayload([2, 3, userRoles.admin.id, 5]);

      const result = checkAdminHandle(userPayload);

      expect(result).toBe(true);
    });

    it('should return undefined when userPayload is null', () => {
      const result = checkAdminHandle(null as any);

      expect(result).toBeUndefined();
    });

    it('should return undefined when userPayload is undefined', () => {
      const result = checkAdminHandle(undefined as any);

      expect(result).toBeUndefined();
    });

    it('should throw error when roles array is undefined', () => {
      const userPayload = {
        ...mockUserPayload([]),
        roles: undefined,
      } as any;

      expect(() => {
        checkAdminHandle(userPayload);
      }).toThrow();
    });
  });
});
