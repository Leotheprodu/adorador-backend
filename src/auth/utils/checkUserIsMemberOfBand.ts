import { SessionData } from 'express-session';
import { CheckUserMemberOfBandType } from '../decorators/permissions.decorators';
import { Request } from 'express';
import { ForbiddenException } from '@nestjs/common';

export const isMemberOfBand = (
  checkUserIsMemberOfBand: CheckUserMemberOfBandType,
  session: SessionData,
  request: Request,
) => {
  const { checkBy, key, isAdmin } = checkUserIsMemberOfBand;
  const bandId =
    checkBy === 'paramBandId' ? request.params[key] : request.body[key];
  const bandsOfUser = session.membersofBands ?? [];
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
