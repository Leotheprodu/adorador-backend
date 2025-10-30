import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthJwtService } from '../services/jwt.service';

@Injectable()
export class JwtUserMiddleware implements NestMiddleware {
  constructor(private jwtService: AuthJwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Extraer el token del header Authorization
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remover 'Bearer ' prefix

      try {
        const payload = this.jwtService.verifyAccessToken(token);

        // Agregar información del usuario al request de manera similar a como funcionaba con sessions
        req.user = payload;

        // Para compatibilidad con código que esperaba session.userId, session.roles, etc.
        (req as any).session = {
          userId: payload.sub,
          name: payload.name,
          email: payload.email,
          isLoggedIn: true,
          roles: payload.roles,
          memberships: payload.memberships,
          membersofBands: payload.membersofBands,
        };
      } catch (error) {
        // Si el token es inválido, no agregamos información del usuario
        // El guard se encargará de manejar la autenticación
      }
    }

    next();
  }
}
