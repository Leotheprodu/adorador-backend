import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { SessionData } from 'express-session';
import { CheckUserIdType } from '../decorators/permissions.decorators';

export const checkUserIdParamHandle = (
  checkUserIdParam: CheckUserIdType,
  session: SessionData,
  request: Request,
) => {
  if (checkUserIdParam) {
    const userIdParam = request.params[checkUserIdParam]; // Valor dinámico o por defecto 'userId'
    if (userIdParam && session.userId !== parseInt(userIdParam, 10)) {
      console.log('User ID does not match.');
      throw new ForbiddenException('User ID does not match.');
    }
  }
};
