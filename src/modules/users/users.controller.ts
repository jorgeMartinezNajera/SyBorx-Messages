import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateUserPresenceDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('Users (Directorio & Perfil)')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('directory')
  @ApiOperation({ summary: 'Obtener directorio de compañeros de trabajo / usuarios activos' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre, usuario o email' })
  async getDirectory(
    @Query() pagination: PaginationDto,
    @Query('search') search?: string,
  ) {
    return this.usersService.getDirectory(pagination, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil público de un usuario por su ID' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Actualizar perfil del usuario actual (nombre, avatar, biografía)' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado exitosamente' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('presence')
  @ApiOperation({ summary: 'Actualizar estado de presencia (ONLINE, IDLE, DND, OFFLINE) y estado personalizado' })
  async updatePresence(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserPresenceDto,
  ) {
    return this.usersService.updatePresence(userId, dto);
  }
}
