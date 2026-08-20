import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DirectChatsService } from './direct-chats.service';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Direct Chats (Mensajería Directa 1 a 1)')
@ApiBearerAuth('JWT-auth')
@Controller('direct-chats')
export class DirectChatsController {
  constructor(private readonly directChatsService: DirectChatsService) {}

  @Post()
  @ApiOperation({ summary: 'Iniciar o abrir conversación directa 1 a 1 con otro usuario' })
  @ApiResponse({ status: 201, description: 'Conversación directa iniciada o recuperada' })
  async createOrGet(
    @CurrentUser('id') currentUserId: string,
    @Body() dto: CreateDirectChatDto,
  ) {
    return this.directChatsService.getOrCreateDirectChat(currentUserId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las conversaciones directas activas del usuario' })
  async getMyChats(@CurrentUser('id') userId: string) {
    return this.directChatsService.getMyDirectChats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener información y miembros de un chat directo por ID' })
  async getById(
    @Param('id') chatId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.directChatsService.getDirectChatById(chatId, userId);
  }
}
