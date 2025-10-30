import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions/permissions.guard';

/**
 * Guard compuesto que primero valida JWT y luego aplica permisos
 * Combina JwtAuthGuard + PermissionsGuard en uno solo
 */
@Injectable()
export class JwtPermissionsGuard implements CanActivate {
  constructor(
    private jwtAuthGuard: JwtAuthGuard,
    private permissionsGuard: PermissionsGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primero validar JWT
    const jwtValid = await this.jwtAuthGuard.canActivate(context);
    if (!jwtValid) {
      return false;
    }

    // Luego aplicar validaciones de permisos
    const permissionsValid = await this.permissionsGuard.canActivate(context);
    return permissionsValid;
  }
}
