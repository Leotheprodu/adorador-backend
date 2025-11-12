import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({
    description: 'ID del último post visto (cursor para paginación)',
    example: 42,
    required: false,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  cursor?: number;

  @ApiProperty({
    description: 'Cantidad de posts por página',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiProperty({
    enum: ['all', 'request', 'share'],
    description: 'Filtrar por tipo de post',
    example: 'all',
    default: 'all',
    required: false,
  })
  @IsEnum(['all', 'request', 'share'])
  @IsOptional()
  type?: 'all' | 'request' | 'share' = 'all';
}
