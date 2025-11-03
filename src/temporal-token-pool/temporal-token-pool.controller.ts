import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TemporalTokenPoolService } from './temporal-token-pool.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { IsNotEmpty, IsString, Matches } from 'class-validator';

class VerifyWhatsAppTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message:
      'El número de teléfono debe ser válido (formato: +codigoPais + número, ej: +50677778888)',
  })
  phoneNumber: string;
}

@ApiTags('temporal-token-pool')
@Controller('temporal-token-pool')
export class TemporalTokenPoolController {
  constructor(
    private readonly temporalTokenPoolService: TemporalTokenPoolService,
  ) {}

  @Post('verify-whatsapp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar token de WhatsApp',
    description:
      'Endpoint para que el bot de WhatsApp pueda verificar tokens de registro',
  })
  @ApiResponse({
    status: 200,
    description: 'Token verificado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido o número de teléfono no coincide',
  })
  @ApiResponse({
    status: 404,
    description: 'Token no encontrado o expirado',
  })
  async verifyWhatsAppToken(@Body() body: VerifyWhatsAppTokenDto) {
    try {
      console.log('[WHATSAPP] Verificación iniciada:', {
        token: body.token?.substring(0, 8) + '...',
        phone: body.phoneNumber,
      });

      const result = await this.temporalTokenPoolService.verifyWhatsAppToken(
        body.token,
        body.phoneNumber,
      );

      console.log('[WHATSAPP] Verificación exitosa:', result);
      return result;
    } catch (error) {
      console.error('[WHATSAPP] Error en verificación:', error);
      throw error;
    }
  }

  @Post('verify-whatsapp-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar token de WhatsApp (endpoint alternativo)',
    description:
      'Endpoint alternativo con nombre más específico para verificar tokens',
  })
  async verifyWhatsAppTokenAlt(@Body() body: VerifyWhatsAppTokenDto) {
    return this.verifyWhatsAppToken(body);
  }
}
