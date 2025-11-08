import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateInvitationDto {
  @IsInt()
  @IsNotEmpty()
  invitedUserId: number;
}
