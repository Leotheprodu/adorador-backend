import { PartialType } from '@nestjs/swagger';
import { CreateChurchMemberRoleDto } from './create-church-member-role.dto';

export class UpdateChurchMemberRoleDto extends PartialType(CreateChurchMemberRoleDto) {}
