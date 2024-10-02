import { PartialType } from '@nestjs/swagger';
import { CreateChurchRoleDto } from './create-church-role.dto';

export class UpdateChurchRoleDto extends PartialType(CreateChurchRoleDto) {}
