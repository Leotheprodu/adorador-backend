import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostStatus } from '@prisma/client';

export class UpdatePostDto {
  @ApiProperty({
    description: 'Nuevo título del post',
    example: 'Busco "Reckless Love" de Cory Asbury',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiProperty({
    description: 'Nueva descripción del post',
    example: 'Actualización: preferiblemente en tono de G',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: ['ACTIVE', 'RESOLVED', 'DELETED'],
    description: 'Cambiar estado del post',
    example: 'RESOLVED',
    required: false,
  })
  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  @ApiProperty({
    description: 'Actualizar título de canción solicitada',
    example: 'Reckless Love',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  requestedSongTitle?: string;

  @ApiProperty({
    description: 'Actualizar artista de canción solicitada',
    example: 'Cory Asbury',
    maxLength: 150,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  requestedArtist?: string;
}
