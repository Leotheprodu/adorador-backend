import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { MembershipsService } from '../../../memberships/memberships.service';
import { JwtAuthGuard } from '../jwt-auth.guard';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;
  let membershipsService: MembershipsService;
  let jwtAuthGuard: JwtAuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    membershipsService = {} as MembershipsService;
    jwtAuthGuard = {} as JwtAuthGuard;
    guard = new PermissionsGuard(reflector, membershipsService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});
