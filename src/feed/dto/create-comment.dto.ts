import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Contenido del comentario',
    example: 'Tengo esta canción! Te la puedo compartir en el post.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ApiProperty({
    description: 'ID del comentario padre (para respuestas)',
    example: 5,
    required: false,
  })
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiProperty({
    description:
      'ID de la canción a compartir en el comentario (para respuestas a solicitudes)',
    example: 42,
    required: false,
  })
  @IsInt()
  @IsOptional()
  sharedSongId?: number;
}
