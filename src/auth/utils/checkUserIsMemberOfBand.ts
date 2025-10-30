import { JwtPayload } from '../services/jwt.service';
import { CheckUserMemberOfBandType } from '../decorators/permissions.decorators';
import { Request } from 'express';
import { ForbiddenException } from '@nestjs/common';

export const isMemberOfBand = (
  checkUserIsMemberOfBand: CheckUserMemberOfBandType,
  userPayload: JwtPayload,
  request: Request,
) => {
  const { checkBy, key, isAdmin } = checkUserIsMemberOfBand;
  const bandId =
    checkBy === 'paramBandId' ? request.params[key] : request.body[key];
  const bandsOfUser = userPayload.membersofBands ?? [];
  const isMember = bandsOfUser.some(
    (band) => band.band.id === parseInt(bandId),
  );
  if (!isMember) {
    throw new ForbiddenException('User is not a member of the band.');
  }
  if (isAdmin) {
    const isAdminOfBand = bandsOfUser.find(
      (band) => band.band.id === parseInt(bandId),
    ).isAdmin;
    if (!isAdminOfBand) {
      throw new ForbiddenException('User is not an admin of the band.');
    }
  }
  return true;
};
