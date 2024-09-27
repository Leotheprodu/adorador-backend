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
  CHECK_USER_ID_KEY,
  CHURCH_ROLE_KEY,
} from 'src/auth/decorators/permissions.decorators';
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = request.session as SessionData;

    // 0. Si el usuario es Admin, permitir acceso
    if (session && session?.roles.includes(userRoles.admin.id)) {
      return true;
    }

    // 1. Verificar si el userId coincide con el usuario autenticado
    const checkUserIdParam = this.reflector.get<string>(
      CHECK_USER_ID_KEY,
      context.getHandler(),
    );
    const userIdParam = request.params[checkUserIdParam || 'userId']; // Valor dinámico o por defecto 'userId'
    if (userIdParam && session.userId === parseInt(userIdParam, 10)) {
      console.log('paso filtro 1', userIdParam);
      return true; // Si coincide, permitir acceso
    }

    // 2. Verificar AppRole
    const appRoles = this.reflector.get<number[]>(
      APP_ROLE_KEY,
      context.getHandler(),
    );
    if (appRoles && appRoles.some((role) => session.roles.includes(role))) {
      return true; // Si tiene el AppRole adecuado, permitir acceso
    }

    // 3. Verificar ChurchRole y membresía activa
    const churchRoleMeta = this.reflector.get<{
      roles: number[];
      churchParam: string;
    }>(CHURCH_ROLE_KEY, context.getHandler());

    if (churchRoleMeta) {
      const { roles, churchParam } = churchRoleMeta;
      const churchId = request.params[churchParam]; // Obtener el churchId desde los parámetros

      if (churchId) {
        // Verificar si el usuario tiene una membresía activa en esa iglesia
        const memberships = session.memberships;
        //verifica si dentro de las membresias del usuario, existe una que tenga el churchId que se esta solicitando
        const membership = memberships.find(
          (m) => m.church.id === parseInt(churchId, 10),
        );

        if (
          membership &&
          roles.some((role) => membership.roles.find((r) => r.id === role))
        ) {
          return true; // Si la membresía es activa y tiene el rol adecuado, permitir acceso
        }
      }
    }

    // Si ninguna de las condiciones se cumple, denegar acceso
    throw new ForbiddenException('Acceso denegado.');
  }
}
