import { ApiProperty } from '@nestjs/swagger';

export class CommentBlessingResponseDto {
  @ApiProperty({
    description: 'Si el usuario actual dio blessing a este comentario',
    example: true,
  })
  blessed: boolean;

  @ApiProperty({
    description: 'Cantidad total de blessings en el comentario',
    example: 5,
  })
  count: number;
}
