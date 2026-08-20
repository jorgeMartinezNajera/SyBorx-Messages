import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto, UpdateUserStatusDto } from './dto/update-role.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GlobalRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@ApiTags('Admin (Gestión Corporativa & Roles)')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Roles(GlobalRole.ADMIN, GlobalRole.SUPERADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Listar todos los usuarios del sistema con filtros de rol y búsqueda' })
  @ApiQuery({ name: 'role', enum: GlobalRole, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  async getAllUsers(
    @Query() pagination: PaginationDto,
    @Query('role') role?: GlobalRole,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(pagination, role, search);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Cambiar el rol corporativo de un usuario (CEO, Admin, Tech Lead, Dev, Guest)' })
  @ApiResponse({ status: 200, description: 'Rol actualizado y registrado en auditoría' })
  @ApiResponse({ status: 403, description: 'Privilegios insuficientes para modificar roles elevados' })
  async updateUserRole(
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser('id') adminId: string,
    @CurrentUser('globalRole') adminRole: GlobalRole,
  ) {
    return this.adminService.updateUserRole(targetUserId, dto, adminId, adminRole);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Activar o desactivar cuenta de usuario' })
  async updateUserStatus(
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser('id') adminId: string,
    @CurrentUser('globalRole') adminRole: GlobalRole,
  ) {
    return this.adminService.updateUserStatus(targetUserId, dto, adminId, adminRole);
  }

  @Post('users/:id/temp-password')
  @ApiOperation({
    summary:
      'Generar una contraseña temporal segura para un usuario y obligar a cambio de clave en el próximo inicio de sesión',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña temporal generada exitosamente y registrada en auditoría',
  })
  async generateTemporaryPassword(
    @Param('id') targetUserId: string,
    @CurrentUser('id') adminId: string,
    @CurrentUser('globalRole') adminRole: GlobalRole,
  ) {
    return this.adminService.generateTemporaryPassword(targetUserId, adminId, adminRole);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Consultar bitácora de auditoría de cambios de roles y seguridad' })
  async getAuditLogs(@Query() pagination: PaginationDto) {
    return this.adminService.getAuditLogs(pagination);
  }
}
