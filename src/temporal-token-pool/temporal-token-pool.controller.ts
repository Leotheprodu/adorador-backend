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
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'El número de teléfono debe ser válido (formato internacional)',
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
    return await this.temporalTokenPoolService.verifyWhatsAppToken(
      body.token,
      body.phoneNumber,
    );
  }
}
