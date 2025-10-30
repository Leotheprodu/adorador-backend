import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../services/jwt.service';
import { CheckUserIdType } from '../decorators/permissions.decorators';

export const checkUserIdParamHandle = (
  checkUserIdParam: CheckUserIdType,
  userPayload: JwtPayload,
  request: Request,
) => {
  if (checkUserIdParam) {
    const userIdParam = request.params[checkUserIdParam]; // Valor dinámico o por defecto 'userId'
    if (userIdParam && userPayload.sub !== parseInt(userIdParam, 10)) {
      console.log('User ID does not match.');
      throw new ForbiddenException('User ID does not match.');
    }
  }
};
