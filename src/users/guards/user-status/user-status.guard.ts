import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { userRoles } from 'config/constants';
import { Observable } from 'rxjs';
import { SessionData } from 'express-session';

@Injectable()
export class UserStatusGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const session = context.switchToHttp().getRequest().session as SessionData;
    const { id } = context.switchToHttp().getRequest().params;
    if (
      session.userId !== parseInt(id) &&
      session.roles.includes(userRoles.admin.id) === false
    ) {
      return false;
    }

    return true;
  }
}
