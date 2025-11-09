import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Interfaces para tipar correctamente la información del usuario
export interface UserMembership {
  id: number;
  church: {
    id: number;
    name: string;
  };
  roles: {
    id: number;
    name: string;
    churchRoleId: number;
  }[];
  since: Date;
}

export interface UserBandMembership {
  id: number;
  role: string;
  isAdmin: boolean;
  isEventManager: boolean;
  band: {
    id: number;
    name: string;
  };
  // Nota: 'active' se filtra en la consulta (where: { active: true })
  // por lo que todas las bandas en el JWT están activas por defecto
}

export interface JwtPayload {
  sub: number; // userId (equivalente a session.userId)
  email: string; // session.email
  name: string; // session.name
  roles: number[]; // session.roles (array de role IDs)
  memberships: UserMembership[]; // session.memberships
  membersofBands: UserBandMembership[]; // session.membersofBands
  // Propiedades adicionales de JWT estándar
  iat?: number; // issued at
  exp?: number; // expires at
}

// Interface para compatibilidad (simula lo que había en session)
export interface SessionCompatible {
  userId: number;
  name: string;
  email: string;
  isLoggedIn: boolean;
  roles: number[];
  memberships: UserMembership[];
  membersofBands: UserBandMembership[];
}

@Injectable()
export class AuthJwtService {
  constructor(private jwtService: JwtService) {}

  generateTokens(
    userId: number,
    email: string,
    name: string,
    roles: number[] = [],
    memberships: UserMembership[] = [],
    membersofBands: UserBandMembership[] = [],
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      name,
      roles,
      memberships,
      membersofBands,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
      expiresIn: '30m', // Aumentado de 15m a 30m para mejor tolerancia a cold starts
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
        expiresIn: '30d', // Aumentado de 7d a 30d para mejor persistencia
      },
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
    });
  }

  verifyRefreshToken(token: string): { sub: number; email: string } {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    });
  }

  /**
   * Convierte el payload JWT a formato compatible con session
   * Útil para migrar código que esperaba session.userId, session.roles, etc.
   */
  jwtToSessionFormat(payload: JwtPayload): SessionCompatible {
    return {
      userId: payload.sub,
      name: payload.name,
      email: payload.email,
      isLoggedIn: true,
      roles: payload.roles,
      memberships: payload.memberships,
      membersofBands: payload.membersofBands,
    };
  }
}
