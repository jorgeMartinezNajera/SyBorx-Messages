import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CommunityRole } from '@prisma/client';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(communityId: string, userId: string, dto: CreateChannelDto) {
    const membership = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId, userId },
      },
    });

    if (
      !membership ||
      (membership.role !== CommunityRole.COMMUNITY_OWNER &&
        membership.role !== CommunityRole.COMMUNITY_ADMIN)
    ) {
      throw new ForbiddenException('Solo los administradores del servidor pueden crear canales');
    }

    const channel = await this.prisma.channel.create({
      data: {
        communityId,
        name: dto.name.toLowerCase().replace(/\s+/g, '-'),
        topic: dto.topic,
        type: dto.type,
        isPrivate: dto.isPrivate ?? false,
        position: dto.position ?? 0,
      },
    });

    return {
      message: 'Canal creado exitosamente',
      channel,
    };
  }

  async getChannelById(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        community: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Canal no encontrado');
    }

    if (channel.community.members.length === 0) {
      throw new ForbiddenException('No tienes acceso a los canales de esta comunidad');
    }

    return channel;
  }

  async deleteChannel(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        community: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Canal no encontrado');
    }

    const userMembership = channel.community.members[0];
    if (
      !userMembership ||
      (userMembership.role !== CommunityRole.COMMUNITY_OWNER &&
        userMembership.role !== CommunityRole.COMMUNITY_ADMIN)
    ) {
      throw new ForbiddenException('No tienes permisos para eliminar canales en esta comunidad');
    }

    await this.prisma.channel.delete({
      where: { id: channelId },
    });

    return { message: 'Canal eliminado exitosamente' };
  }
}
