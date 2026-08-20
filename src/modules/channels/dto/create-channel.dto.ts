import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({ example: 'dev-backend', description: 'Nombre del canal' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del canal es obligatorio' })
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'Canal de discusión sobre arquitecturas y bases de datos' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;

  @ApiPropertyOptional({ enum: ChannelType, default: ChannelType.TEXT, description: 'Tipo de canal (TEXT, VOICE_PREP, ANNOUNCEMENT)' })
  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  position?: number;
}
