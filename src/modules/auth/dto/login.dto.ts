import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'dev@syborx.com', description: 'Correo electrónico o nombre de usuario' })
  @IsNotEmpty({ message: 'El identificador (email o username) es requerido' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña del usuario' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  password: string;
}
