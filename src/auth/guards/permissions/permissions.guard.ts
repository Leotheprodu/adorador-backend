import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { userRoles } from 'config/constants';
import { SessionData } from 'express-session';
import { Observable } from 'rxjs';
import {
  APP_ROLE_KEY,
  CHECK_CHURCH,
  CHECK_LOGIN_STATUS,
  CHECK_USER_ID_KEY,
  CHURCH_ROLE_KEY,
} from 'src/auth/decorators/permissions.decorators';
import { UsersService } from 'src/users/users.service';
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const session = request.session as SessionData;

    const checkLoginStatus = this.reflector.get<string>(
      CHECK_LOGIN_STATUS,
      context.getHandler(),
    );
    if (checkLoginStatus) {
      if (checkLoginStatus === 'loggedIn' && !session.isLoggedIn) {
        throw new ForbiddenException('User is not logged in.');
      } else if (checkLoginStatus === 'notLoggedIn' && session.isLoggedIn) {
        throw new ForbiddenException('User is already logged in.');
      }
    }

    // 0. Si el usuario es Admin, permitir acceso
    if (session && session?.roles.includes(userRoles.admin.id)) {
      return true;
    }

    // 1. Verificar si el userId coincide con el usuario autenticado
    const checkUserIdParam = this.reflector.get<string>(
      CHECK_USER_ID_KEY,
      context.getHandler(),
    );
    const userIdParam = request.params[checkUserIdParam]; // Valor dinámico o por defecto 'userId'

    if (checkUserIdParam) {
      if (userIdParam && session.userId !== parseInt(userIdParam, 10)) {
        throw new ForbiddenException('User ID does not match.');
      }
    }
    // 2. Verificar AppRole
    const appRoles = this.reflector.get<number[]>(
      APP_ROLE_KEY,
      context.getHandler(),
    );

    if (appRoles) {
      if (!appRoles.some((role) => session.roles.includes(role))) {
        throw new ForbiddenException('User does not have the required role.');
      }
    }

    // 3. Verificar si el elemento que se va a editar pertenece a la iglesia del usuario autenticado
    const checkChurch = this.reflector.get<{
      checkBy: 'paramUserId';
      key: string;
    }>(CHECK_CHURCH, context.getHandler());

    if (checkChurch) {
      const { checkBy, key } = checkChurch;
      const userReqMemberships = session.memberships;
      const userReqChurchIds = userReqMemberships.map(
        (membership) => membership.church.id,
      );
      if (checkBy === 'paramUserId') {
        const userId = request.params[key]; // Obtener el churchId desde los parámetros
        const user = await this.usersService.getUser(parseInt(userId));
        const userParamMemberships = user.memberships;
        const userParamschurchIds = userParamMemberships.map(
          (membership) => membership.church.id,
        );
        // verifica que userParamschurchIds contenga al menos un elemento de userReqChurchIds
        if (!userReqChurchIds.some((id) => userParamschurchIds.includes(id))) {
          throw new ForbiddenException('User Church does not match.');
        }
      }
    }

    return true;
  }
}
