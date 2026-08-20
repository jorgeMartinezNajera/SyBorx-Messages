import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty({ example: 'Equipo de Arquitectura y Cloud', description: 'Nombre de la comunidad o espacio de trabajo' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la comunidad es obligatorio' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Comunidad dedicada a infraestructura, DevOps y microservicios', description: 'Descripción de la comunidad' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/icon.png', description: 'URL del icono' })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.png', description: 'URL del banner' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional({ default: false, description: 'Indica si la comunidad es privada por invitación' })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'IDs de usuarios para agregar automáticamente a la comunidad', example: ['uuid-1', 'uuid-2'] })
  @IsOptional()
  memberIds?: string[];
}

export class UpdateCommunityDto {
  @ApiPropertyOptional({ example: 'Nuevo Nombre de la Comunidad' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Nueva descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
