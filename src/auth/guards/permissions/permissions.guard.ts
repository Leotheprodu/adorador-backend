import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../../services/jwt.service';
import {
  APP_ROLE_KEY,
  AppRoleType,
  CHECK_CHURCH,
  CHECK_LOGIN_STATUS,
  CHECK_USER_ID_KEY,
  CHECK_USER_MEMBER_OF_BAND,
  CHECK_BAND_ADMIN,
  CheckChurchType,
  CheckLoginStatusType,
  CheckUserIdType,
  CheckUserMemberOfBandType,
  CheckBandAdminType,
} from '../../decorators/permissions.decorators';
import { checkAdminHandle } from '../../utils/checkAdminHandle';
import { checkAppRolesHandle } from '../../utils/checkAppRolesHandle';
import { checkChurchHandle } from '../../utils/checkChurchHandle';
import { checkLoginStatusHandle } from '../../utils/checkLoginStatusHandle';
import { checkUserIdParamHandle } from '../../utils/checkUserIdParamHandle';
import { isMemberOfBand } from '../../utils/checkUserIsMemberOfBand';
import { isBandAdmin } from '../../utils/checkUserIsBandAdmin';
import { MembershipsService } from '../../../memberships/memberships.service';
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private membershipsService: MembershipsService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Asumimos que el JWT ya fue validado por JwtAuthGuard
    // Si no hay usuario, significa que no pasó por la validación JWT
    const userPayload = request.user as JwtPayload;

    // Primero obtener el checkLoginStatus para verificar si la ruta permite acceso sin autenticación
    const checkLoginStatus = this.reflector.get<CheckLoginStatusType>(
      CHECK_LOGIN_STATUS,
      context.getHandler(),
    );

    // Si no hay usuario y la ruta requiere 'notLoggedIn', permitir el acceso
    if (!userPayload && checkLoginStatus === 'notLoggedIn') {
      return true;
    }

    // Si la ruta es 'public', permitir acceso con o sin autenticación
    if (checkLoginStatus === 'public') {
      return true;
    }

    // Si no hay usuario y la ruta no es 'notLoggedIn' ni 'public', rechazar
    if (!userPayload) {
      throw new UnauthorizedException('No JWT token provided or invalid');
    }
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
    const checkUserIsMemberOfBand =
      this.reflector.get<CheckUserMemberOfBandType>(
        CHECK_USER_MEMBER_OF_BAND,
        context.getHandler(),
      );
    const checkBandAdminParam = this.reflector.get<CheckBandAdminType>(
      CHECK_BAND_ADMIN,
      context.getHandler(),
    );

    try {
      checkLoginStatusHandle(checkLoginStatus, userPayload);
    } catch (error) {
      console.log('User is not authenticated.');
      throw new ForbiddenException('User is not authenticated.');
    }

    // Revisar si el usuario es administrador
    try {
      checkAdminHandle(userPayload);
    } catch (error) {
      console.log('User is not an admin.');
      throw new ForbiddenException('User is not an admin.');
    }

    // Revisar si el usuario tiene los roles necesarios para acceder al controlador
    try {
      checkAppRolesHandle(appRoles, userPayload);
    } catch (error) {
      console.log('User does not have the required roles.');
      throw new ForbiddenException('User does not have the required roles.');
    }

    // Revisar si el usuario es miembro de la iglesia y si tiene los roles necesarios
    try {
      await checkChurchHandle(
        checkChurch,
        userPayload,
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
      checkUserIdParamHandle(checkUserIdParam, userPayload, request);
    } catch (error) {
      console.log('User ID does not match.');
      throw new ForbiddenException('User ID does not match.');
    }

    // Revisar si el usuario es miembro de la banda
    try {
      isMemberOfBand(checkUserIsMemberOfBand, userPayload, request);
    } catch (error) {
      console.log('User is not a member of the band or not admin.');
      throw new ForbiddenException(error.message);
    }

    // Revisar si el usuario es administrador de la banda
    try {
      isBandAdmin(checkBandAdminParam, userPayload, request);
    } catch (error) {
      console.log('User is not an admin of this band.');
      throw new ForbiddenException(error.message);
    }

    return true;
  }
}
