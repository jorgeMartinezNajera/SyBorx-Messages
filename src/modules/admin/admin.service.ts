import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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
          mustChangePassword: true,
          passwordChangedAt: true,
          temporaryPasswordExpiresAt: true,
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
        isActive: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_ROLE_UPDATED',
        details: JSON.stringify({
          targetUserId,
          oldRole: targetUser.globalRole,
          newRole: dto.role,
        }),
      },
    });

    return {
      message: `Rol de ${targetUser.email} actualizado a ${dto.role}`,
      user: updatedUser,
    };
  }

  async updateUserStatus(
    targetUserId: string,
    dto: UpdateUserStatusDto,
    adminId: string,
    adminRole: GlobalRole,
  ) {
    if (targetUserId === adminId && !dto.isActive) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta de administrador');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (targetUser.globalRole === GlobalRole.SUPERADMIN && adminRole !== GlobalRole.SUPERADMIN) {
      throw new ForbiddenException('Solo un SUPERADMIN puede desactivar la cuenta de otro SUPERADMIN');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: dto.isActive },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        globalRole: true,
        isActive: true,
      },
    });

    if (!dto.isActive) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId: targetUserId },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: dto.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        details: JSON.stringify({
          targetUserId,
          previousStatus: targetUser.isActive,
          newStatus: dto.isActive,
        }),
      },
    });

    return {
      message: `Estado de la cuenta ${targetUser.email} actualizado a ${dto.isActive ? 'Activo' : 'Inactivo'}`,
      user: updatedUser,
    };
  }

  async generateTemporaryPassword(
    targetUserId: string,
    adminId: string,
    adminRole: GlobalRole,
  ) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (
      targetUser.globalRole === GlobalRole.SUPERADMIN &&
      adminRole !== GlobalRole.SUPERADMIN
    ) {
      throw new ForbiddenException(
        'Solo un SUPERADMIN puede restablecer la contraseña de otro SUPERADMIN',
      );
    }

    // Generar contraseña temporal segura: ej. SyB#8kL9v!2
    const prefix = 'SyB';
    const randChars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const symbols = '!@#$%&*';
    let middle = '';
    for (let i = 0; i < 6; i++) {
      middle += randChars.charAt(Math.floor(Math.random() * randChars.length));
    }
    const symbol = symbols.charAt(Math.floor(Math.random() * symbols.length));
    const num = Math.floor(Math.random() * 90 + 10);
    const tempPassword = `${prefix}${symbol}${middle}${num}!`;

    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const temporaryPasswordExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        passwordHash,
        mustChangePassword: true,
        temporaryPasswordExpiresAt,
      },
    });

    // Invalidar tokens previos
    await this.prisma.refreshToken.deleteMany({
      where: { userId: targetUserId },
    });

    // Registrar en auditoría
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'USER_TEMPORARY_PASSWORD_GENERATED',
        details: JSON.stringify({
          targetUserId,
          targetEmail: targetUser.email,
          temporaryPasswordExpiresAt,
        }),
      },
    });

    return {
      message: `Contraseña temporal generada con éxito para ${targetUser.email}`,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        username: targetUser.username,
        displayName: targetUser.displayName,
      },
      temporaryPassword: tempPassword,
      expiresAt: temporaryPasswordExpiresAt,
      mustChangePassword: true,
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
