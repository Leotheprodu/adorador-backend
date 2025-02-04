import { IsNotEmpty, IsString } from 'class-validator';

export class NewPaswordDTO {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
