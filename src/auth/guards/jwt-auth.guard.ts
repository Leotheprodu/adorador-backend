import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthJwtService, JwtPayload } from '../services/jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: AuthJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = this.jwtService.verifyAccessToken(token);
      // Agregamos la información del usuario al request para que esté disponible en los controllers
      request.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// Interface para TypeScript para que el request.user tenga tipos
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
