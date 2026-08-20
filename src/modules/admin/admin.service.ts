import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserRoleDto, UpdateUserStatusDto } from './dto/update-role.dto';
import { GlobalRole } from '@prisma/client';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(pagination: PaginationDto, role?: GlobalRole, search?: string) {
    const { skip, limit } = pagination;

    const where: any = {};
    if (role) {
      where.globalRole = role;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          globalRole: true,
          status: true,
          isActive: true,
          authProvider: true,
          createdAt: true,
          _count: {
            select: {
              ownedCommunities: true,
              communityMemberships: true,
              sentMessages: true,
            },
          },
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page: pagination.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserRole(
    targetUserId: string,
    dto: UpdateUserRoleDto,
    adminId: string,
    adminRole: GlobalRole,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Only SUPERADMIN can assign or revoke SUPERADMIN role
    if (
      (dto.role === GlobalRole.SUPERADMIN || targetUser.globalRole === GlobalRole.SUPERADMIN) &&
      adminRole !== GlobalRole.SUPERADMIN
    ) {
      throw new ForbiddenException('Solo un SuperAdministrador puede modificar o asignar el rol de SUPERADMIN');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { globalRole: dto.role },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        globalRole: true,
        updatedAt: true,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_ROLE_UPDATED',
        details: JSON.stringify({
          targetUserId,
          targetUserEmail: targetUser.email,
          previousRole: targetUser.globalRole,
          newRole: dto.role,
          reason: dto.reason || 'Actualización administrativa de rol',
        }),
      },
    });

    this.logger.log(`Role updated for user ${targetUser.email} to ${dto.role} by admin ${adminId}`);

    return {
      message: `Rol del usuario ${targetUser.username} actualizado exitosamente a ${dto.role}`,
      user: updatedUser,
    };
  }

  async updateUserStatus(
    targetUserId: string,
    dto: UpdateUserStatusDto,
    adminId: string,
  ) {
    if (targetUserId === adminId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta de administrador');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: dto.isActive },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true,
      },
    });

    // If deactivated, revoke all active sessions
    if (!dto.isActive) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: targetUserId },
      });
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: dto.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        details: JSON.stringify({
          targetUserId,
          reason: dto.reason || 'Cambio de estado administrativo',
        }),
      },
    });

    return {
      message: `Estado de la cuenta ${targetUser.email} actualizado a ${dto.isActive ? 'Activo' : 'Inactivo'}`,
      user: updatedUser,
    };
  }

  async getAuditLogs(pagination: PaginationDto) {
    const { skip, limit } = pagination;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              globalRole: true,
            },
          },
        },
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page: pagination.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
