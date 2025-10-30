import { JwtPayload } from '../services/jwt.service';
import { AppRoleType } from '../decorators/permissions.decorators';
import { ForbiddenException } from '@nestjs/common';

export const checkAppRolesHandle = (
  appRoles: AppRoleType,
  userPayload: JwtPayload,
) => {
  if (appRoles) {
    if (!appRoles.some((role) => userPayload.roles.includes(role))) {
      console.log('User does not have the required role.');
      throw new ForbiddenException('User does not have the required role.');
    }
  }
};
