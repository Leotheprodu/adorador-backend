import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionData } from 'express-session';
import {
  APP_ROLE_KEY,
  AppRoleType,
  CHECK_CHURCH,
  CHECK_LOGIN_STATUS,
  CHECK_USER_ID_KEY,
  CheckChurchType,
  CheckLoginStatusType,
  CheckUserIdType,
} from 'src/auth/decorators/permissions.decorators';
import { checkAdminHandle } from 'src/auth/utils/checkAdminHandle';
import { checkAppRolesHandle } from 'src/auth/utils/checkAppRolesHandle';
import { checkChurchHandle } from 'src/auth/utils/checkChurchHandle';
import { checkLoginStatusHandle } from 'src/auth/utils/checkLoginStatusHandle';
import { checkUserIdParamHandle } from 'src/auth/utils/checkUserIdParamHandle';
import { MembershipsService } from 'src/memberships/memberships.service';
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private membershipsService: MembershipsService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const session = request.session as SessionData;

    const checkLoginStatus = this.reflector.get<CheckLoginStatusType>(
      CHECK_LOGIN_STATUS,
      context.getHandler(),
    );
    const checkUserIdParam = this.reflector.get<CheckUserIdType>(
      CHECK_USER_ID_KEY,
      context.getHandler(),
    );
    const appRoles = this.reflector.get<AppRoleType>(
      APP_ROLE_KEY,
      context.getHandler(),
    );
    const checkChurch = this.reflector.get<CheckChurchType>(
      CHECK_CHURCH,
      context.getHandler(),
    );

    checkLoginStatusHandle(checkLoginStatus, session);

    checkAdminHandle(session, checkLoginStatus);

    checkAppRolesHandle(appRoles, session);

    checkChurchHandle(checkChurch, session, request, this.membershipsService);

    checkUserIdParamHandle(checkUserIdParam, session, request);

    return true;
  }
}
