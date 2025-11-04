import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { AuthJwtService } from '../auth/services/jwt.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: AuthJwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const req = client.request as Request;

    // Extraer token del header Authorization o de query parameters
    const token = this.extractToken(req);

    if (token) {
      try {
        const payload = this.jwtService.verifyAccessToken(token);
        // Agregar información del usuario al request para uso posterior
        (req as any).user = payload;
        console.log('WebSocket authenticated user:', payload.sub);
        return true;
      } catch (error) {
        console.log('Invalid JWT token in WebSocket connection');
      }
    }

    client.emit(
      'unauthorized',
      'No tienes permiso para realizar esta acción - Token inválido',
    );
    client.disconnect();
    return false;
  }

  private extractToken(req: Request): string | null {
    // Intentar obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Como fallback, intentar obtenerlo de query parameters
    const tokenFromQuery = req.query?.token as string;
    return tokenFromQuery || null;
  }
}
