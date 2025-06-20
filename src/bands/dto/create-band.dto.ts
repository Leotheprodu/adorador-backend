import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBandDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
