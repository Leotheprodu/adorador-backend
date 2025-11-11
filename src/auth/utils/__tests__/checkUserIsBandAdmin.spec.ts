import { isBandAdmin } from '../checkUserIsBandAdmin';
import { ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '../../services/jwt.service';

describe('checkUserIsBandAdmin', () => {
  describe('isBandAdmin', () => {
    const mockRequest = {
      params: { bandId: '10' },
      body: {},
    };

    const createMockUser = (overrides?: Partial<JwtPayload>): JwtPayload => ({
      sub: 1,
      name: 'Test User',
      email: 'test@example.com',
      roles: [],
      memberships: [],
      membersofBands: [],
      ...overrides,
    });

    it('should allow system admin (role id = 1) regardless of band membership', () => {
      const systemAdminUser = createMockUser({
        roles: [1], // System admin
      });

      expect(() => {
        isBandAdmin(
          { checkBy: 'paramBandId', key: 'bandId' },
          systemAdminUser,
          mockRequest as any,
        );
      }).not.toThrow();
    });

    it('should allow band admin when checking by param', () => {
      const bandAdminUser = createMockUser({
        membersofBands: [
          {
            id: 1,
            role: 'Admin',
            isAdmin: true,
            isEventManager: false,
            band: {
              id: 10,
              name: 'Test Band',
            },
          },
        ],
      });

      expect(() => {
        isBandAdmin(
          { checkBy: 'paramBandId', key: 'bandId' },
          bandAdminUser,
          mockRequest as any,
        );
      }).not.toThrow();
    });

    it('should throw ForbiddenException when user is not band admin', () => {
      const regularUser = createMockUser({
        membersofBands: [
          {
            id: 1,
            role: 'Member',
            isAdmin: false, // Not admin
            isEventManager: true, // Even if event manager
            band: {
              id: 10,
              name: 'Test Band',
            },
          },
        ],
      });

      expect(() => {
        isBandAdmin(
          { checkBy: 'paramBandId', key: 'bandId' },
          regularUser,
          mockRequest as any,
        );
      }).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user is not member of the band', () => {
      const userFromOtherBand = createMockUser({
        membersofBands: [
          {
            id: 1,
            role: 'Admin',
            isAdmin: true,
            isEventManager: false,
            band: {
              id: 99, // Different band
              name: 'Other Band',
            },
          },
        ],
      });

      expect(() => {
        isBandAdmin(
          { checkBy: 'paramBandId', key: 'bandId' },
          userFromOtherBand,
          mockRequest as any,
        );
      }).toThrow(ForbiddenException);
    });

    it('should allow band admin when checking by param (testing both params)', () => {
      const requestWithBody = {
        params: { bandId: '10' },
        body: {},
      };

      const bandAdminUser = createMockUser({
        membersofBands: [
          {
            id: 1,
            role: 'Admin',
            isAdmin: true,
            isEventManager: false,
            band: {
              id: 10,
              name: 'Test Band',
            },
          },
        ],
      });

      expect(() => {
        isBandAdmin(
          { checkBy: 'paramBandId', key: 'bandId' },
          bandAdminUser,
          requestWithBody as any,
        );
      }).not.toThrow();
    });

    it('should throw when bandId is not found in request', () => {
      const emptyRequest = {
        params: {},
        body: {},
      };

      const bandAdminUser = createMockUser({
        membersofBands: [
          {
            id: 1,
            role: 'Admin',
            isAdmin: true,
            isEventManager: false,
            band: {
              id: 10,
              name: 'Test Band',
            },
          },
        ],
      });

      expect(() => {
        isBandAdmin(
          { checkBy: 'paramBandId', key: 'bandId' },
          bandAdminUser,
          emptyRequest as any,
        );
      }).toThrow();
    });
  });
});
