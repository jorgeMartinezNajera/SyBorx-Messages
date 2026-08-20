import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateProfileDto, UpdateUserPresenceDto } from './dto/update-user.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getDirectory(pagination: PaginationDto, search?: string) {
    const { skip, limit } = pagination;

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          globalRole: true,
          status: true,
          customStatus: true,
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

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        globalRole: true,
        status: true,
        customStatus: true,
        createdAt: true,
        communityMemberships: {
          include: {
            community: {
              select: {
                id: true,
                name: true,
                iconUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.displayName && { displayName: dto.displayName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        globalRole: true,
        status: true,
        customStatus: true,
      },
    });

    return {
      message: 'Perfil actualizado exitosamente',
      user: updated,
    };
  }

  async updatePresence(userId: string, dto: UpdateUserPresenceDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.customStatus !== undefined && { customStatus: dto.customStatus }),
      },
      select: {
        id: true,
        status: true,
        customStatus: true,
      },
    });

    return {
      message: 'Estado de presencia actualizado',
      presence: updated,
    };
  }
}
