import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'El número de teléfono debe ser válido (formato internacional)',
  })
  phone: string; // Cambio de email a phone

  @IsString()
  @IsNotEmpty()
  password: string;
}
