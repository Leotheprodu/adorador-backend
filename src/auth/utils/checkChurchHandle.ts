import { ForbiddenException } from '@nestjs/common';
import { CheckChurchType } from '../decorators/permissions.decorators';
import { SessionData } from 'express-session';
import { Request } from 'express';
import { MembershipsService } from 'src/memberships/memberships.service';

export const checkChurchHandle = async (
  checkChurch: CheckChurchType,
  session: SessionData,
  request: Request,
  membershipsService: MembershipsService,
) => {
  // 3. Verificar si el elemento que se va a editar pertenece a la iglesia del usuario autenticado
  if (checkChurch) {
    const { checkBy, key, churchRolesBypass, churchRoleStrict } = checkChurch;
    const userReqMemberships = session.memberships ?? [];
    const userReqChurchIds = userReqMemberships.map(
      (membership) => membership.church.id,
    );
    if (!userReqMemberships || userReqMemberships.length === 0) {
      throw new ForbiddenException('User does not have memberships.');
    }

    if (checkBy === 'paramMembershipId') {
      const membershipId = request.params[key]; // Obtener el churchId desde los parámetros
      const membership = await membershipsService.findOne(
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
    if (checkBy === 'bodyChurchId' || checkBy === 'paramChurchId') {
      const churchId =
        checkBy === 'bodyChurchId' ? request.body[key] : request.params[key]; // Obtener el churchId desde el cuerpo de la petición
      if (!userReqChurchIds.includes(parseInt(churchId, 10))) {
        throw new ForbiddenException(
          'Church does not belong to the user authenticated.',
        );
      }
      if (churchRolesBypass && churchRolesBypass.length > 0) {
        const userReqMembership = userReqMemberships?.find(
          (membership) => membership.church.id === parseInt(churchId, 10),
        );

        const userReqRoleIds =
          userReqMembership.roles.map((role) => role.churchRoleId) ?? [];

        if (churchRolesBypass.some((role) => userReqRoleIds.includes(role))) {
          return true;
        } else if (churchRoleStrict) {
          throw new ForbiddenException(
            'User does not have the required role in the church.',
          );
        }
      }
    }
  }
};
