import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsString()
  @IsOptional() // Ahora el email es opcional
  email?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'El número de teléfono debe ser válido (formato internacional)',
  })
  phone: string; // Ahora es requerido

  @IsString()
  @IsOptional()
  birthdate: string | Date;

  // contiene 'active' o 'inactive'
  @IsString()
  @IsOptional()
  status: 'active' | 'inactive';
}
