import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { AddCommunityMemberDto } from './dto/add-community-member.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GlobalRole } from '@prisma/client';

@ApiTags('Communities (Espacios de Trabajo / Servidores estilo Discord)')
@ApiBearerAuth('JWT-auth')
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una nueva comunidad/espacio de trabajo (Solo Ingenieros, Tech Leads, Admins, CEO)',
  })
  @ApiResponse({ status: 201, description: 'Comunidad creada exitosamente con canal general por defecto' })
  @ApiResponse({ status: 403, description: 'Los roles GUEST no pueden crear comunidades' })
  async create(
    @CurrentUser('id') userId: string,
    @CurrentUser('globalRole') userGlobalRole: GlobalRole,
    @Body() dto: CreateCommunityDto,
  ) {
    return this.communitiesService.create(userId, userGlobalRole, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Listar todas las comunidades a las que pertenece el usuario autenticado' })
  async getMyCommunities(@CurrentUser('id') userId: string) {
    return this.communitiesService.getMyCommunities(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una comunidad, sus canales y lista de miembros' })
  async getCommunityById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.getCommunityById(id, userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Agregar un miembro a la comunidad (requiere rol de Admin en el servidor)' })
  async addMember(
    @Param('id') communityId: string,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: AddCommunityMemberDto,
  ) {
    return this.communitiesService.addMember(communityId, currentUserId, dto);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Unirse a una comunidad pública' })
  async joinPublic(
    @Param('id') communityId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.joinPublicCommunity(communityId, userId);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Abandonar una comunidad' })
  async leave(
    @Param('id') communityId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.leaveCommunity(communityId, userId);
  }
}
