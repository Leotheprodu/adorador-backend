import { SessionData } from 'express-session';
import { CheckUserIdType } from '../decorators/permissions.decorators';
import { ForbiddenException } from '@nestjs/common';

export const checkLoginStatusHandle = (
  checkLoginStatus: CheckUserIdType,
  session: SessionData,
) => {
  if (checkLoginStatus) {
    if (checkLoginStatus === 'loggedIn' && !session.isLoggedIn) {
      console.log('User is not logged in.');
      throw new ForbiddenException('User is not logged in.');
    } else if (checkLoginStatus === 'notLoggedIn' && session.isLoggedIn) {
      console.log('User is already logged in.');
      throw new ForbiddenException('User is already logged in.');
    }
  }
};
