import { userRoles } from 'config/constants';
import { SessionData } from 'express-session';
import { CheckUserIdType } from '../decorators/permissions.decorators';

export const checkAdminHandle = (
  session: SessionData,
  checkLoginStatus?: CheckUserIdType,
): boolean => {
  if (
    !checkLoginStatus ||
    (checkLoginStatus && checkLoginStatus !== 'notLoggedIn')
  ) {
    if (session && session?.roles.includes(userRoles.admin.id)) {
      return true;
    }
  }
};
