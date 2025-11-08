import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateMemberDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  isAdmin?: boolean;

  @IsBoolean()
  @IsOptional()
  isEventManager?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
