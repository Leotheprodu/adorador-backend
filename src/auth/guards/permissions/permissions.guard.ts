import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
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
    try {
      checkLoginStatusHandle(checkLoginStatus, session);
    } catch (error) {
      console.log('User is not authenticated.');
      throw new ForbiddenException('User is not authenticated.');
    }

    // Revisar si el usuario es administrador
    try {
      checkAdminHandle(session);
    } catch (error) {
      console.log('User is not an admin.');
      throw new ForbiddenException('User is not an admin.');
    }

    // Revisar si el usuario tiene los roles necesarios para acceder al controlador
    try {
      checkAppRolesHandle(appRoles, session);
    } catch (error) {
      console.log('User does not have the required roles.');
      throw new ForbiddenException('User does not have the required roles.');
    }

    // Revisar si el usuario es miembro de la iglesia y si tiene los roles necesarios
    try {
      await checkChurchHandle(
        checkChurch,
        session,
        request,
        this.membershipsService,
      );
    } catch (error) {
      console.log(
        'User does not have the required church memberships or roles.',
      );
      throw new ForbiddenException(
        'User does not have the required church memberships or roles.',
      );
    }

    // Revisar si el usuario autenticado es el mismo que se realiza la petición
    try {
      checkUserIdParamHandle(checkUserIdParam, session, request);
    } catch (error) {
      console.log('User ID does not match.');
      throw new ForbiddenException('User ID does not match.');
    }

    return true;
  }
}
