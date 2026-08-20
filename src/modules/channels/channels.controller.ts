import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Channels (Canales de Comunidades)')
@ApiBearerAuth('JWT-auth')
@Controller()
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post('communities/:communityId/channels')
  @ApiOperation({ summary: 'Crear un nuevo canal dentro de una comunidad' })
  @ApiResponse({ status: 201, description: 'Canal creado exitosamente' })
  @ApiResponse({ status: 403, description: 'Requiere permisos de administrador en la comunidad' })
  async create(
    @Param('communityId') communityId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channelsService.create(communityId, userId, dto);
  }

  @Get('channels/:id')
  @ApiOperation({ summary: 'Obtener información de un canal por ID' })
  async getById(
    @Param('id') channelId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.channelsService.getChannelById(channelId, userId);
  }

  @Delete('channels/:id')
  @ApiOperation({ summary: 'Eliminar un canal (solo administradores del servidor)' })
  async delete(
    @Param('id') channelId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.channelsService.deleteChannel(channelId, userId);
  }
}
