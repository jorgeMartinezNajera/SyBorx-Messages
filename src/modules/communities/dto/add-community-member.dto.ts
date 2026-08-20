import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AddCommunityMemberDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', description: 'ID de usuario a agregar' })
  @IsNotEmpty({ message: 'El ID de usuario es obligatorio' })
  @IsUUID('4', { message: 'El ID de usuario debe ser un UUID válido' })
  userId: string;

  @ApiPropertyOptional({
    enum: CommunityRole,
    default: CommunityRole.COMMUNITY_MEMBER,
    description: 'Rol interno en el servidor/comunidad (COMMUNITY_ADMIN, COMMUNITY_MODERATOR, COMMUNITY_MEMBER)',
  })
  @IsOptional()
  @IsEnum(CommunityRole)
  role?: CommunityRole;

  @ApiPropertyOptional({ example: 'Tech Advisor' })
  @IsOptional()
  @IsString()
  nickname?: string;
}

export class UpdateCommunityMemberRoleDto {
  @ApiProperty({
    enum: CommunityRole,
    example: CommunityRole.COMMUNITY_ADMIN,
    description: 'Nuevo rol interno del miembro en el servidor',
  })
  @IsNotEmpty()
  @IsEnum(CommunityRole)
  role: CommunityRole;
}
