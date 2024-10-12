import { HttpException, HttpStatus } from '@nestjs/common';
import { SessionData } from 'express-session';
import { SongsService } from '../songs.service';

export const checkChurchBySongId = async (
  session: SessionData,
  songsService: SongsService,
  songId: number,
  churchRolesBypass?: number[],
) => {
  const song = await songsService.findOne(songId);

  if (!song)
    throw new HttpException('Song does not exist.', HttpStatus.NOT_FOUND);

  const churchId = song.churchId;
  const userReqMemberships = session.memberships;
  const userReqChurchIds = userReqMemberships.map(
    (membership) => membership.church.id,
  );

  if (!userReqMemberships || userReqMemberships.length === 0) {
    throw new HttpException(
      'User does not have memberships.',
      HttpStatus.FORBIDDEN,
    );
  }

  if (!userReqChurchIds.includes(churchId)) {
    throw new HttpException(
      'Church does not belong to the user authenticated.',
      403,
    );
  }

  if (churchRolesBypass && churchRolesBypass.length > 0) {
    const userReqMembership = userReqMemberships?.find(
      (membership) => membership.church.id === churchId,
    );
    const userReqRoleIds = userReqMembership.roles.map(
      (role) => role.churchRoleId,
    );

    if (!churchRolesBypass.some((role) => userReqRoleIds.includes(role)))
      throw new HttpException(
        'User does not have the required role in the church.',
        HttpStatus.UNAUTHORIZED,
      );
  }

  return song;
};
