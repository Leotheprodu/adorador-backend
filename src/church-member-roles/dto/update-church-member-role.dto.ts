import { PartialType } from '@nestjs/swagger';
import { CreateChurchMemberRoleDto } from './create-church-member-role.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateChurchMemberRoleDto extends PartialType(
  CreateChurchMemberRoleDto,
) {
  @IsString()
  @IsOptional()
  endDate: Date;
}
