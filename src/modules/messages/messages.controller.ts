import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto, AddReactionDto } from './dto/create-message.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('Messages (Mensajería, Hilos & Reacciones)')
@ApiBearerAuth('JWT-auth')
@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Enviar nuevo mensaje a un canal o chat directo (con soporte para adjuntos)' })
  @ApiResponse({ status: 201, description: 'Mensaje creado y distribuido' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(userId, dto);
  }

  @Get('channels/:channelId/messages')
  @ApiOperation({ summary: 'Obtener historial de mensajes paginado de un canal' })
  async getChannelMessages(
    @Param('channelId') channelId: string,
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagesService.getChannelMessages(channelId, userId, pagination);
  }

  @Get('direct-chats/:chatId/messages')
  @ApiOperation({ summary: 'Obtener historial de mensajes paginado de un chat directo 1 a 1' })
  async getDirectMessages(
    @Param('chatId') chatId: string,
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.messagesService.getDirectMessages(chatId, userId, pagination);
  }

  @Patch('messages/:id')
  @ApiOperation({ summary: 'Editar el contenido de un mensaje existente (solo autor)' })
  async update(
    @Param('id') messageId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.update(messageId, userId, dto);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Eliminar un mensaje (autor o administrador de la comunidad)' })
  async delete(
    @Param('id') messageId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messagesService.delete(messageId, userId);
  }

  @Post('messages/:id/reactions')
  @ApiOperation({ summary: 'Añadir o remover reacción emoji a un mensaje (Toggle)' })
  async toggleReaction(
    @Param('id') messageId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddReactionDto,
  ) {
    return this.messagesService.toggleReaction(messageId, userId, dto);
  }
}
