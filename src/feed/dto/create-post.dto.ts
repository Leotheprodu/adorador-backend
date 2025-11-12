import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PostType } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty({
    enum: ['SONG_REQUEST', 'SONG_SHARE'],
    description: 'Tipo de post: solicitar o compartir canción',
    example: 'SONG_SHARE',
  })
  @IsEnum(PostType)
  @IsNotEmpty()
  type: PostType;

  @ApiProperty({
    description: 'ID de la banda del autor',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  bandId: number;

  @ApiProperty({
    description: 'Título del post',
    example: 'Busco "Como en el cielo" de Elevation Worship',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Descripción o detalles adicionales del post',
    example:
      'Necesito esta canción para el culto del domingo, si alguien la tiene con acordes sería genial.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  // Para SONG_SHARE
  @ApiProperty({
    description:
      'ID de la canción que se está compartiendo (solo para SONG_SHARE)',
    example: 42,
    required: false,
  })
  @IsInt()
  @IsOptional()
  sharedSongId?: number;

  // Para SONG_REQUEST
  @ApiProperty({
    description: 'Título de la canción solicitada (solo para SONG_REQUEST)',
    example: 'Como en el cielo',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  requestedSongTitle?: string;

  @ApiProperty({
    description: 'Artista de la canción solicitada (solo para SONG_REQUEST)',
    example: 'Elevation Worship',
    maxLength: 150,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  requestedArtist?: string;

  @ApiProperty({
    description:
      'URL de YouTube de la canción solicitada (solo para SONG_REQUEST)',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    maxLength: 300,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  requestedYoutubeUrl?: string;
}
