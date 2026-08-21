import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class AttachmentInputDto {
  @ApiProperty({ example: 'diagrama-bd.png' })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({ example: 'syborx-1712345678.png' })
  @IsString()
  @IsNotEmpty()
  storedName: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ example: 204800 })
  @IsNumber()
  fileSizeBytes: number;

  @ApiProperty({ example: 'http://localhost:3000/uploads/syborx-1712345678.png' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;
}

export class CreateMessageDto {
  @ApiPropertyOptional({ example: 'Hola equipo, aquí está el diagrama', description: 'Contenido del mensaje (opcional si se envían adjuntos)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0', description: 'ID del canal (si el mensaje es en un canal)' })
  @IsOptional()
  @IsUUID('4')
  channelId?: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-2345-6789abcdef01', description: 'ID del chat directo (si el mensaje es 1 a 1)' })
  @IsOptional()
  @IsUUID('4')
  directChatId?: string;

  @ApiPropertyOptional({ description: 'ID del mensaje padre si es una respuesta o hilo' })
  @IsOptional()
  @IsUUID('4')
  parentMessageId?: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({ type: [AttachmentInputDto], description: 'Lista de archivos adjuntos' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentInputDto)
  attachments?: AttachmentInputDto[];
}

export class UpdateMessageDto {
  @ApiProperty({ example: 'Contenido corregido del mensaje' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AddReactionDto {
  @ApiProperty({ example: '👍', description: 'Emoji de reacción' })
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
