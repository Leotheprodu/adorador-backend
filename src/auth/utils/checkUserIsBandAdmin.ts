import { JwtPayload } from '../services/jwt.service';
import { CheckBandAdminType } from '../decorators/permissions.decorators';
import { Request } from 'express';
import { ForbiddenException } from '@nestjs/common';

/**
 * Valida si el usuario es administrador de la banda (isAdmin)
 * Los admins del sistema tienen bypass automático
 * NOTA: isEventManager NO es suficiente - debe ser isAdmin de la banda
 */
export const isBandAdmin = (
  checkBandAdmin: CheckBandAdminType,
  userPayload: JwtPayload,
  request: Request,
) => {
  // Si no hay configuración, permitir acceso
  if (!checkBandAdmin) {
    return true;
  }

  // Verificar si el usuario es administrador del sistema (bypass)
  const isSystemAdmin = userPayload.roles?.some((role) => role === 1);
  if (isSystemAdmin) {
    return true;
  }

  const { checkBy, key } = checkBandAdmin;
  const bandId = request.params[key];
  const bandsOfUser = userPayload.membersofBands ?? [];

  // Buscar si el usuario es miembro de la banda
  const bandMembership = bandsOfUser.find(
    (band) => band.band.id === parseInt(bandId),
  );

  if (!bandMembership) {
    throw new ForbiddenException(
      'User is not a member of the band. Only band members can access this resource.',
    );
  }

  // Verificar si es ADMIN de la banda (no solo event manager)
  if (!bandMembership.isAdmin) {
    throw new ForbiddenException(
      'User is not an admin of this band. Only band admins can perform this action.',
    );
  }

  return true;
};
