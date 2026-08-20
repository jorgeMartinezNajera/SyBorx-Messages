import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Contraseña actual o contraseña temporal recibida',
    example: 'Temporal123!',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({
    description:
      'Nueva contraseña segura (mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial)',
    example: 'MiNuevaClaveSegura2026!',
  })
  @IsNotEmpty({ message: 'La nueva contraseña no puede estar vacía' })
  @IsString()
  @Length(8, 50, { message: 'La contraseña debe tener entre 8 y 50 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{8,50}$/,
    {
      message:
        'La contraseña debe incluir al menos una letra mayúscula, una minúscula, un número y un carácter especial (!@#$%^&*...)',
    },
  )
  newPassword: string;
}
