import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { userRoles } from 'config/constants';
import { Observable } from 'rxjs';
import { JwtPayload } from 'src/auth/services/jwt.service';

@Injectable()
export class UserStatusGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const user = context.switchToHttp().getRequest().user as JwtPayload;
    const { id } = context.switchToHttp().getRequest().params;

    if (!user) {
      return false;
    }

    if (
      user.sub !== parseInt(id) &&
      user.roles.includes(userRoles.admin.id) === false
    ) {
      return false;
    }

    return true;
  }
}
