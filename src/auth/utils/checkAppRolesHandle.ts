import { SessionData } from 'express-session';
import { AppRoleType } from '../decorators/permissions.decorators';
import { ForbiddenException } from '@nestjs/common';

export const checkAppRolesHandle = (
  appRoles: AppRoleType,
  session: SessionData,
) => {
  if (appRoles) {
    if (!appRoles.some((role) => session.roles.includes(role))) {
      throw new ForbiddenException('User does not have the required role.');
    }
  }
};
