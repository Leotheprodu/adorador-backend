import { userRoles } from 'config/constants';
import { SessionData } from 'express-session';

export const checkAdminHandle = (session: SessionData): boolean => {
  if (session.isLoggedIn) {
    if (session?.roles.includes(userRoles.admin.id)) {
      return true;
    }
  }
};
