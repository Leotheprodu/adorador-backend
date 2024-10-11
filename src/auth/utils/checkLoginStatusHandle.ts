import { SessionData } from 'express-session';
import { CheckUserIdType } from '../decorators/permissions.decorators';
import { ForbiddenException } from '@nestjs/common';
import { userRoles } from 'config/constants';

export const checkLoginStatusHandle = (
  checkLoginStatus: CheckUserIdType,
  session: SessionData,
) => {
  if (checkLoginStatus) {
    if (checkLoginStatus === 'loggedIn' && !session.isLoggedIn) {
      throw new ForbiddenException('User is not logged in.');
    } else if (checkLoginStatus === 'notLoggedIn' && session.isLoggedIn) {
      throw new ForbiddenException('User is already logged in.');
    }
  }
};
