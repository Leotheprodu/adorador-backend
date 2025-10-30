import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload, SessionCompatible } from '../services/jwt.service';

type UserDataType = keyof JwtPayload | 'sessionFormat';

export const GetUser = createParamDecorator(
  (
    data: UserDataType | undefined,
    ctx: ExecutionContext,
  ): JwtPayload | SessionCompatible | any => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) return null;

    if (data === 'sessionFormat') {
      // Devuelve formato compatible con session
      return {
        userId: user.sub,
        name: user.name,
        email: user.email,
        isLoggedIn: true,
        roles: user.roles,
        memberships: user.memberships,
        membersofBands: user.membersofBands,
      } as SessionCompatible;
    }

    if (data && typeof data === 'string' && data in user) {
      return user?.[data as keyof JwtPayload];
    }

    return user;
  },
);
