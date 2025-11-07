import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteBandDto {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmation: string; // "estoy seguro que esto es irreversible"
}
