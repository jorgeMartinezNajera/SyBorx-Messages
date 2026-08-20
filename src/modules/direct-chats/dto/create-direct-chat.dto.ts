import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateDirectChatDto {
  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-2345-6789abcdef01',
    description: 'ID del usuario con quien se desea iniciar o abrir el chat 1 a 1',
  })
  @IsNotEmpty({ message: 'El ID de usuario destinatario es obligatorio' })
  @IsUUID('4', { message: 'El ID debe ser un UUID válido' })
  recipientId: string;
}
