import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { userRoles } from 'config/constants';
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
    if (checkLoginStatus) {
      if (checkLoginStatus === 'loggedIn' && !session.isLoggedIn) {
        throw new ForbiddenException('User is not logged in.');
      } else if (checkLoginStatus === 'notLoggedIn' && session.isLoggedIn) {
        throw new ForbiddenException('User is already logged in.');
      }
    }

    // 0. Si el usuario es Admin, permitir acceso
    if (
      !checkLoginStatus ||
      (checkLoginStatus && checkLoginStatus !== 'notLoggedIn')
    ) {
      if (session && session?.roles.includes(userRoles.admin.id)) {
        return true;
      }
    }

    // 1. Verificar si el userId coincide con el usuario autenticado

    // 2. Verificar AppRole
    const appRoles = this.reflector.get<AppRoleType>(
      APP_ROLE_KEY,
      context.getHandler(),
    );

    if (appRoles) {
      if (!appRoles.some((role) => session.roles.includes(role))) {
        throw new ForbiddenException('User does not have the required role.');
      }
    }

    // 3. Verificar si el elemento que se va a editar pertenece a la iglesia del usuario autenticado
    const checkChurch = this.reflector.get<CheckChurchType>(
      CHECK_CHURCH,
      context.getHandler(),
    );
    if (checkChurch) {
      const { checkBy, key, churchRolesBypass, churchRoleStrict } = checkChurch;
      const userReqMemberships = session.memberships;
      const userReqChurchIds = userReqMemberships.map(
        (membership) => membership.church.id,
      );
      if (!userReqMemberships || userReqMemberships.length === 0) {
        throw new ForbiddenException('User does not have memberships.');
      }

      if (checkBy === 'paramMembershipId') {
        const membershipId = request.params[key]; // Obtener el churchId desde los parámetros
        const membership = await this.membershipsService.findOne(
          parseInt(membershipId, 10),
        );
        const churchId = membership.churchId;
        if (!userReqChurchIds.includes(churchId)) {
          throw new ForbiddenException(
            'Church does not belong to the user authenticated.',
          );
        }
        if (churchRolesBypass && churchRolesBypass.length > 0) {
          const userReqMembership = userReqMemberships?.find(
            (membership) => membership.church.id === churchId,
          );
          const userReqRoleIds = userReqMembership.roles.map(
            (role) => role.churchRoleId,
          );

          if (churchRolesBypass.some((role) => userReqRoleIds.includes(role))) {
            return true;
          } else if (churchRoleStrict) {
            throw new ForbiddenException(
              'User does not have the required role in the church.',
            );
          }
        }
        // verifica que userParamschurchIds contenga al menos un elemento de userReqChurchIds
      }
      if (checkBy === 'bodyChurchId') {
        const churchId = request.body[key]; // Obtener el churchId desde el cuerpo de la petición
        if (!userReqChurchIds.includes(parseInt(churchId, 10))) {
          throw new ForbiddenException(
            'Church does not belong to the user authenticated.',
          );
        }
        if (churchRolesBypass && churchRolesBypass.length > 0) {
          const userReqMembership = userReqMemberships?.find(
            (membership) => membership.church.id === churchId,
          );

          const userReqRoleIds = userReqMembership.roles.map(
            (role) => role.churchRoleId,
          );

          if (churchRolesBypass.some((role) => userReqRoleIds.includes(role))) {
            return true;
          } else if (churchRoleStrict) {
            throw new ForbiddenException(
              'User does not have the required role in the church.',
            );
          }
        } //NOTE si se da el caso que el usuario tiene otra membresía en otra iglesia, y tiene el rol en otra membresía creo que lo deja hacer cambios, hay que revisar
      }
    }

    const userIdParam = request.params[checkUserIdParam]; // Valor dinámico o por defecto 'userId'

    if (checkUserIdParam) {
      if (userIdParam && session.userId !== parseInt(userIdParam, 10)) {
        throw new ForbiddenException('User ID does not match.');
      }
    }

    return true;
  }
}
