import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateChurchMemberRoleDto {
  @IsNumber()
  @IsNotEmpty()
  roleId: number;

  @IsString()
  @IsOptional()
  startDateTime: Date;

  @IsBoolean()
  @IsOptional()
  active: boolean;
}
