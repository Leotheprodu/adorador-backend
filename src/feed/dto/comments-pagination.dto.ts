import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CommentsPaginationDto {
  @ApiProperty({
    description: 'ID del último comentario visto (cursor para paginación)',
    example: 42,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  cursor?: number;

  @ApiProperty({
    description: 'Cantidad de comentarios por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
