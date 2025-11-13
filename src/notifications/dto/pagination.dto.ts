import { IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cursor?: number; // ID del último elemento cargado

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean = false;
}
