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

    // Si no hay token, permitir el paso y dejar que PermissionsGuard decida
    // según el decorador @CheckLoginStatus
    if (!token) {
      request.user = null;
      return true;
    }

    try {
      const payload = this.jwtService.verifyAccessToken(token);
      // Agregamos la información del usuario al request para que esté disponible en los controllers
      request.user = payload;
      return true;
    } catch (error) {
      // Si el token es inválido, también permitir el paso y dejar que
      // PermissionsGuard maneje la autorización
      request.user = null;
      return true;
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
