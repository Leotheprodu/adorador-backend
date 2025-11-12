import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CopySongDto {
  @ApiProperty({
    description: 'ID de la banda destino donde se copiará la canción',
    example: 3,
  })
  @IsInt()
  @IsNotEmpty()
  targetBandId: number;

  @ApiProperty({
    description: 'Nueva tonalidad para la canción copiada (opcional)',
    example: 'G',
    required: false,
  })
  @IsString()
  @IsOptional()
  newKey?: string;

  @ApiProperty({
    description: 'Nuevo tempo para la canción copiada (opcional)',
    example: 120,
    required: false,
  })
  @IsInt()
  @IsOptional()
  newTempo?: number;
}
