import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token vigente para renovación de sesión' })
  @IsNotEmpty({ message: 'El refresh token es requerido' })
  @IsString()
  refreshToken: string;
}
