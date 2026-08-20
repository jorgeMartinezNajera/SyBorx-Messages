import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommunityDto, UpdateCommunityDto } from './dto/create-community.dto';
import { AddCommunityMemberDto, UpdateCommunityMemberRoleDto } from './dto/add-community-member.dto';
import { CommunityRole, GlobalRole, ChannelType } from '@prisma/client';

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, userGlobalRole: GlobalRole, dto: CreateCommunityDto) {
    // Only Engineers / Tech Leads / Admins / SuperAdmins can create communities
    if (userGlobalRole === GlobalRole.GUEST) {
      throw new ForbiddenException(
        'Los usuarios con rol GUEST no tienen permisos para crear comunidades o espacios de trabajo',
      );
    }

    const community = await this.prisma.community.create({
      data: {
        name: dto.name,
        description: dto.description,
        iconUrl: dto.iconUrl,
        bannerUrl: dto.bannerUrl,
        isPrivate: dto.isPrivate ?? false,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: CommunityRole.COMMUNITY_OWNER,
          },
        },
        channels: {
          create: [
            {
              name: 'general',
              topic: 'Canal general de la comunidad',
              type: ChannelType.TEXT,
              position: 0,
            },
          ],
        },
      },
      include: {
        channels: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                globalRole: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Comunidad creada exitosamente',
      community,
    };
  }

  async getMyCommunities(userId: string) {
    const memberships = await this.prisma.communityMember.findMany({
      where: { userId },
      include: {
        community: {
          include: {
            channels: {
              orderBy: { position: 'asc' },
            },
            _count: {
              select: {
                members: true,
                channels: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.community,
      userRoleInCommunity: m.role,
      userNickname: m.nickname,
      joinedAt: m.joinedAt,
    }));
  }

  async getCommunityById(communityId: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: {
        channels: {
          orderBy: { position: 'asc' },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                customStatus: true,
                globalRole: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            channels: true,
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Comunidad no encontrada');
    }

    // Check membership if private
    const membership = community.members.find((m) => m.userId === userId);
    if (community.isPrivate && !membership) {
      throw new ForbiddenException('Esta comunidad es privada y requiere invitación');
    }

    return {
      ...community,
      isMember: !!membership,
      userRoleInCommunity: membership?.role || null,
    };
  }

  async addMember(communityId: string, currentUserId: string, dto: AddCommunityMemberDto) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: { members: true },
    });

    if (!community) {
      throw new NotFoundException('Comunidad no encontrada');
    }

    // Check if requester has admin/owner rights in the community
    const currentMember = community.members.find((m) => m.userId === currentUserId);
    if (
      !currentMember ||
      (currentMember.role !== CommunityRole.COMMUNITY_OWNER &&
        currentMember.role !== CommunityRole.COMMUNITY_ADMIN)
    ) {
      throw new ForbiddenException('No tienes permisos para invitar o agregar miembros a esta comunidad');
    }

    // Check if already a member
    const alreadyMember = community.members.some((m) => m.userId === dto.userId);
    if (alreadyMember) {
      throw new ConflictException('El usuario ya es miembro de esta comunidad');
    }

    const newMember = await this.prisma.communityMember.create({
      data: {
        communityId,
        userId: dto.userId,
        role: dto.role || CommunityRole.COMMUNITY_MEMBER,
        nickname: dto.nickname,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            globalRole: true,
          },
        },
      },
    });

    return {
      message: 'Miembro agregado exitosamente',
      member: newMember,
    };
  }

  async joinPublicCommunity(communityId: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Comunidad no encontrada');
    }

    if (community.isPrivate) {
      throw new ForbiddenException('No puedes unirte directamente a una comunidad privada');
    }

    const existing = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId, userId },
      },
    });

    if (existing) {
      return { message: 'Ya eres miembro de esta comunidad', member: existing };
    }

    const member = await this.prisma.communityMember.create({
      data: {
        communityId,
        userId,
        role: CommunityRole.COMMUNITY_MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      message: 'Te has unido a la comunidad exitosamente',
      member,
    };
  }

  async leaveCommunity(communityId: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new NotFoundException('Comunidad no encontrada');
    }

    if (community.ownerId === userId) {
      throw new BadRequestException(
        'El propietario no puede abandonar la comunidad sin transferir la propiedad primero',
      );
    }

    await this.prisma.communityMember.delete({
      where: {
        communityId_userId: { communityId, userId },
      },
    });

    return { message: 'Has salido de la comunidad exitosamente' };
  }
}
