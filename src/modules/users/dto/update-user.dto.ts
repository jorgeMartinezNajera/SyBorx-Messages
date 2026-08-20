import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Alex Developer', description: 'Nombre para mostrar' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL de imagen de perfil' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Desarrollador enfocado en React y WebSockets', description: 'Biografía del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bio?: string;
}

export class UpdateUserPresenceDto {
  @ApiPropertyOptional({ enum: UserStatus, example: UserStatus.ONLINE, description: 'Estado de conexión' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ example: ' Trabajando en el sprint de mensajería', description: 'Estado personalizado' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customStatus?: string;
}
