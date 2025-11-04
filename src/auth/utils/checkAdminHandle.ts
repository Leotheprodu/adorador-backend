import { userRoles } from '../../../config/constants';
import { JwtPayload } from '../services/jwt.service';

export const checkAdminHandle = (userPayload: JwtPayload): boolean => {
  if (userPayload) {
    if (userPayload?.roles.includes(userRoles.admin.id)) {
      return true;
    }
  }
};
