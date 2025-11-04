import { HttpException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';

interface TokenInfo {
  token: string;
  phone: string; // Cambio de email a phone
  type: string;
  date: Date;
}

@Injectable()
export class TemporalTokenPoolService implements OnModuleInit {
  private globalTokens: Set<TokenInfo> = new Set();

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.cleanUpTokens();
  }

  @Cron('0 */15 * * * *', { name: crypto.randomUUID() }) // Ejecuta cada 15 minutos
  async cleanUpTokens() {
    const now = new Date();
    const tokensToDelete: TokenInfo[] = [];

    // Limpiar tokens del pool global (más frecuentemente)
    this.globalTokens.forEach((tokenInfo) => {
      const tokenAge = now.getTime() - tokenInfo.date.getTime();
      // Limpiar tokens de más de 15 minutos del pool global
      if (tokenAge > 15 * 60 * 1000) {
        tokensToDelete.push(tokenInfo);
      }
    });

    // Limpiar tokens de la base de datos (cada 24 horas)
    const shouldCleanDatabase = now.getHours() === 0 && now.getMinutes() < 15;

    for (const tokenInfo of tokensToDelete) {
      this.globalTokens.delete(tokenInfo);

      // Solo intentar eliminar de la DB si es limpieza diaria o si el token es muy viejo
      const tokenAgeHours =
        (now.getTime() - tokenInfo.date.getTime()) / (1000 * 60 * 60);
      if (shouldCleanDatabase || tokenAgeHours > 24) {
        try {
          await this.prisma.temporal_token_pool.delete({
            where: { token: tokenInfo.token },
          });
        } catch (error) {
          // Token ya no existe en DB, continuar
          console.log(`Token ${tokenInfo.token} ya fue eliminado de la DB`);
        }
      }
    }

    if (tokensToDelete.length > 0) {
      console.log(`Limpiados ${tokensToDelete.length} tokens expirados`);
    }
  }

  async createToken(token: string, userPhone: string, type: string) {
    if (type === 'forgot_password' || type === 'verify_phone') {
      // Limpiar tokens expirados antes de verificar
      this.cleanExpiredGlobalTokens();

      // Verificar si el usuario ya tiene un token activo (no expirado)
      const now = new Date();
      let existingToken = false;

      this.globalTokens.forEach((tokenInfo) => {
        if (tokenInfo.phone === userPhone && tokenInfo.type === type) {
          const tokenAge = now.getTime() - tokenInfo.date.getTime();
          // Solo bloquear si el token tiene menos de 5 minutos (evitar spam)
          if (tokenAge < 5 * 60 * 1000) {
            // 5 minutos
            existingToken = true;
          } else {
            // Token expirado, removerlo
            this.globalTokens.delete(tokenInfo);
          }
        }
      });

      if (existingToken) {
        throw new HttpException(
          'Ya se envió una verificación recientemente. Espera 5 minutos antes de intentar de nuevo.',
          400,
        );
      }

      this.globalTokens.add({
        token,
        phone: userPhone,
        type,
        date: new Date(),
      });
    }
    return await this.prisma.temporal_token_pool.create({
      data: { token, userPhone, type },
    });
  }

  async findToken(token: string) {
    return await this.prisma.temporal_token_pool.findUnique({
      where: { token },
    });
  }

  async deleteToken(token: string) {
    // También remover de globalTokens si existe
    this.globalTokens.forEach((tokenInfo) => {
      if (tokenInfo.token === token) {
        this.globalTokens.delete(tokenInfo);
      }
    });

    return await this.prisma.temporal_token_pool.delete({
      where: { token },
    });
  }

  // Método para limpiar tokens del pool global cuando falla el envío de WhatsApp
  async removeTokenFromGlobalPool(phone: string, type: string) {
    this.globalTokens.forEach((tokenInfo) => {
      if (tokenInfo.phone === phone && tokenInfo.type === type) {
        this.globalTokens.delete(tokenInfo);
      }
    });
  }

  // Método para limpiar tokens expirados del pool global
  cleanExpiredGlobalTokens() {
    const now = new Date();
    this.globalTokens.forEach((tokenInfo) => {
      // Limpiar tokens de más de 15 minutos
      const tokenAge = now.getTime() - tokenInfo.date.getTime();
      if (tokenAge > 15 * 60 * 1000) {
        // 15 minutos
        this.globalTokens.delete(tokenInfo);
      }
    });
  }

  // Método para verificar token por WhatsApp
  async verifyWhatsAppToken(token: string, phoneNumber: string) {
    console.log('[WHATSAPP-SERVICE] Iniciando verificación:', {
      token: token?.substring(0, 8) + '...',
      phone: phoneNumber,
    });

    try {
      // Validar entrada
      if (!token || !phoneNumber) {
        console.log('[WHATSAPP-SERVICE] Datos faltantes');
        throw new HttpException(
          'Token y número de teléfono son requeridos',
          400,
        );
      }

      // Normalizar número de teléfono (agregar + si no lo tiene)
      const normalizedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+${phoneNumber}`;
      console.log('[WHATSAPP-SERVICE] Número normalizado:', normalizedPhone);

      const tokenData = await this.findToken(token);
      console.log('[WHATSAPP-SERVICE] Token encontrado:', !!tokenData);

      if (!tokenData) {
        throw new HttpException('Token no encontrado o expirado', 404);
      }

      console.log('[WHATSAPP-SERVICE] Comparando teléfonos:', {
        tokenPhone: tokenData.userPhone,
        requestPhone: normalizedPhone,
      });

      if (tokenData.userPhone !== normalizedPhone) {
        throw new HttpException(
          'El número de teléfono no coincide con el token',
          400,
        );
      }

      if (tokenData.type !== 'verify_phone') {
        console.log(
          '[WHATSAPP-SERVICE] Tipo de token inválido:',
          tokenData.type,
        );
        throw new HttpException('Tipo de token inválido', 400);
      }

      console.log('[WHATSAPP-SERVICE] Activando usuario...');
      // Activar al usuario
      const updatedUser = await this.prisma.users.update({
        where: { phone: normalizedPhone },
        data: { status: 'active' },
      });

      console.log('[WHATSAPP-SERVICE] Usuario activado:', updatedUser.id);

      // Eliminar el token
      await this.deleteToken(token);
      console.log('[WHATSAPP-SERVICE] Token eliminado');

      return {
        success: true,
        message: 'Cuenta verificada exitosamente',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          phone: updatedUser.phone,
        },
      };
    } catch (error) {
      console.error('[WHATSAPP-SERVICE] Error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno del servidor al verificar token',
        500,
      );
    }
  }

  // Método para verificar token de reset de contraseña por WhatsApp
  async verifyWhatsAppResetToken(token: string, phoneNumber: string) {
    console.log('[WHATSAPP-RESET-SERVICE] Iniciando verificación:', {
      token: token?.substring(0, 8) + '...',
      phone: phoneNumber,
    });

    try {
      // Validar entrada
      if (!token || !phoneNumber) {
        console.log('[WHATSAPP-RESET-SERVICE] Datos faltantes');
        throw new HttpException(
          'Token y número de teléfono son requeridos',
          400,
        );
      }

      // Normalizar número de teléfono (agregar + si no lo tiene)
      const normalizedPhone = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+${phoneNumber}`;
      console.log(
        '[WHATSAPP-RESET-SERVICE] Número normalizado:',
        normalizedPhone,
      );

      const tokenData = await this.findToken(token);
      console.log('[WHATSAPP-RESET-SERVICE] Token encontrado:', !!tokenData);

      if (!tokenData) {
        throw new HttpException('Token no encontrado o expirado', 404);
      }

      console.log('[WHATSAPP-RESET-SERVICE] Comparando teléfonos:', {
        tokenPhone: tokenData.userPhone,
        requestPhone: normalizedPhone,
      });

      if (tokenData.userPhone !== normalizedPhone) {
        throw new HttpException(
          'El número de teléfono no coincide con el token',
          400,
        );
      }

      if (tokenData.type !== 'forgot_password') {
        console.log(
          '[WHATSAPP-RESET-SERVICE] Tipo de token inválido:',
          tokenData.type,
        );
        throw new HttpException(
          'Tipo de token inválido para reset de contraseña',
          400,
        );
      }

      console.log(
        '[WHATSAPP-RESET-SERVICE] Obteniendo información del usuario...',
      );
      // Obtener información del usuario
      const user = await this.prisma.users.findUnique({
        where: { phone: normalizedPhone },
        select: { id: true, name: true, phone: true },
      });

      if (!user) {
        throw new HttpException('Usuario no encontrado', 404);
      }

      console.log('[WHATSAPP-RESET-SERVICE] Usuario encontrado:', user.id);

      // Generar link de reset (el token se mantiene para el formulario de reset)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

      console.log('[WHATSAPP-RESET-SERVICE] Link de reset generado');

      // NO eliminamos el token aquí, se eliminará cuando se complete el reset

      return {
        success: true,
        message:
          'Token de reset verificado. Usa el link para restablecer tu contraseña.',
        resetLink,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
        },
      };
    } catch (error) {
      console.error('[WHATSAPP-RESET-SERVICE] Error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno del servidor al verificar token de reset',
        500,
      );
    }
  }

  // Método para obtener estadísticas del pool (útil para debugging)
  getPoolStats() {
    const now = new Date();
    const stats = {
      totalTokens: this.globalTokens.size,
      forgotPasswordTokens: 0,
      verifyPhoneTokens: 0,
      expiredTokens: 0,
    };

    this.globalTokens.forEach((tokenInfo) => {
      if (tokenInfo.type === 'forgot_password') stats.forgotPasswordTokens++;
      if (tokenInfo.type === 'verify_phone') stats.verifyPhoneTokens++;

      const tokenAge = now.getTime() - tokenInfo.date.getTime();
      if (tokenAge > 15 * 60 * 1000) stats.expiredTokens++;
    });

    return stats;
  }
}
