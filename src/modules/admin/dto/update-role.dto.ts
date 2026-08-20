import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: GlobalRole,
    example: GlobalRole.TECH_LEAD,
    description: 'Nuevo rol corporativo del usuario (SUPERADMIN, ADMIN, TECH_LEAD, DEVELOPER, GUEST)',
  })
  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsEnum(GlobalRole, { message: 'El rol especificado no es válido' })
  role: GlobalRole;

  @ApiPropertyOptional({
    example: 'Ascenso a Líder Técnico de Proyecto',
    description: 'Motivo del cambio de rol para el registro de auditoría',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ example: true, description: 'Estado activo o bloqueado de la cuenta' })
  @IsNotEmpty()
  isActive: boolean;

  @ApiPropertyOptional({ example: 'Bloqueo temporal por mantenimiento de credenciales' })
  @IsOptional()
  @IsString()
  reason?: string;
}
