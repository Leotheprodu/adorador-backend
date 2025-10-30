import { JwtPayload } from '../services/jwt.service';
import { CheckUserIdType } from '../decorators/permissions.decorators';
import { ForbiddenException } from '@nestjs/common';

export const checkLoginStatusHandle = (
  checkLoginStatus: CheckUserIdType,
  userPayload: JwtPayload | null,
) => {
  if (checkLoginStatus) {
    if (checkLoginStatus === 'loggedIn' && !userPayload) {
      console.log('User is not logged in.');
      throw new ForbiddenException('User is not logged in.');
    } else if (checkLoginStatus === 'notLoggedIn' && userPayload) {
      console.log('User is already logged in.');
      throw new ForbiddenException('User is already logged in.');
    }
  }
};
