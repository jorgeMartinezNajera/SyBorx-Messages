import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMessageDto, UpdateMessageDto, AddReactionDto } from './dto/create-message.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { CommunityRole } from '@prisma/client';

import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(senderId: string, dto: CreateMessageDto) {
    if (!dto.channelId && !dto.directChatId) {
      throw new BadRequestException('El mensaje debe tener como destino un channelId o un directChatId');
    }

    if (dto.channelId && dto.directChatId) {
      throw new BadRequestException('El mensaje no puede enviarse simultáneamente a un canal y a un chat directo');
    }

    // If channel message, verify membership
    if (dto.channelId) {
      const channel = await this.prisma.channel.findUnique({
        where: { id: dto.channelId },
        include: {
          community: {
            include: {
              members: { where: { userId: senderId } },
            },
          },
        },
      });

      if (!channel) {
        throw new NotFoundException('Canal no encontrado');
      }

      if (channel.community.members.length === 0) {
        throw new ForbiddenException('No perteneces a la comunidad a la que pertenece este canal');
      }
    }

    // If direct chat message, verify participation
    if (dto.directChatId) {
      const directChat = await this.prisma.directChat.findUnique({
        where: { id: dto.directChatId },
        include: {
          members: { where: { userId: senderId } },
        },
      });

      if (!directChat) {
        throw new NotFoundException('Chat directo no encontrado');
      }

      if (directChat.members.length === 0) {
        throw new ForbiddenException('No participas en esta conversación directa');
      }
    }

    const hasText = Boolean(dto.content && dto.content.trim().length > 0);
    const hasAttachments = Boolean(dto.attachments && dto.attachments.length > 0);

    if (!hasText && !hasAttachments) {
      throw new BadRequestException('El mensaje debe contener texto o al menos un archivo adjunto');
    }

    let resolvedMessageType = dto.messageType || 'TEXT';
    if (!hasText && hasAttachments) {
      const firstAtt = dto.attachments[0];
      const isImg = (firstAtt.mimeType && firstAtt.mimeType.startsWith('image/')) || /\.(png|jpe?g|gif|webp|svg)$/i.test(firstAtt.originalName || '');
      resolvedMessageType = isImg ? 'IMAGE' : 'FILE';
    }

    // Create message with attachments
    const message = await this.prisma.message.create({
      data: {
        senderId,
        channelId: dto.channelId,
        directChatId: dto.directChatId,
        parentMessageId: dto.parentMessageId,
        content: hasText ? dto.content.trim() : '',
        messageType: resolvedMessageType,
        ...(hasAttachments
          ? {
              attachments: {
                create: dto.attachments.map((att) => ({
                  originalName: att.originalName,
                  storedName: att.storedName,
                  mimeType: att.mimeType,
                  fileSizeBytes: att.fileSizeBytes,
                  fileUrl: att.fileUrl,
                })),
              },
            }
          : {}),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            globalRole: true,
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    // If direct chat, update directChat updatedAt timestamp
    if (dto.directChatId) {
      await this.prisma.directChat.update({
        where: { id: dto.directChatId },
        data: { updatedAt: new Date() },
      });
    }

    // Broadcast to real-time subscribers
    this.realtimeGateway.emitNewMessage(message);

    return message;
  }

  async getChannelMessages(channelId: string, userId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;

    // Verify channel access
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        community: {
          include: {
            members: { where: { userId } },
          },
        },
      },
    });

    if (!channel || channel.community.members.length === 0) {
      throw new ForbiddenException('No tienes acceso a los mensajes de este canal');
    }

    const [total, messages] = await Promise.all([
      this.prisma.message.count({ where: { channelId } }),
      this.prisma.message.findMany({
        where: { channelId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              globalRole: true,
            },
          },
          attachments: true,
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
    ]);

    return {
      data: messages.reverse(), // chronologically ordered for client chat display
      meta: {
        total,
        page: pagination.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDirectMessages(directChatId: string, userId: string, pagination: PaginationDto) {
    const { skip, limit } = pagination;

    const chat = await this.prisma.directChat.findUnique({
      where: { id: directChatId },
      include: {
        members: { where: { userId } },
      },
    });

    if (!chat || chat.members.length === 0) {
      throw new ForbiddenException('No tienes acceso a esta conversación directa');
    }

    const [total, messages] = await Promise.all([
      this.prisma.message.count({ where: { directChatId } }),
      this.prisma.message.findMany({
        where: { directChatId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              globalRole: true,
            },
          },
          attachments: true,
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: messages.reverse(),
      meta: {
        total,
        page: pagination.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(messageId: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('Solo el autor puede editar este mensaje');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto.content,
        isEdited: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        attachments: true,
      },
    });

    return updated;
  }

  async delete(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            community: {
              include: {
                members: { where: { userId } },
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Mensaje no encontrado');
    }

    const isAuthor = message.senderId === userId;
    let isCommunityAdmin = false;

    if (message.channel && message.channel.community.members.length > 0) {
      const role = message.channel.community.members[0].role;
      isCommunityAdmin = role === CommunityRole.COMMUNITY_OWNER || role === CommunityRole.COMMUNITY_ADMIN;
    }

    if (!isAuthor && !isCommunityAdmin) {
      throw new ForbiddenException('No tienes permisos para eliminar este mensaje');
    }

    await this.prisma.message.delete({
      where: { id: messageId },
    });

    return { message: 'Mensaje eliminado exitosamente' };
  }

  async toggleReaction(messageId: string, userId: string, dto: AddReactionDto) {
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji: dto.emoji,
        },
      },
    });

    if (existing) {
      await this.prisma.messageReaction.delete({
        where: { id: existing.id },
      });
      return { message: 'Reacción removida', action: 'REMOVED', emoji: dto.emoji };
    }

    const reaction = await this.prisma.messageReaction.create({
      data: {
        messageId,
        userId,
        emoji: dto.emoji,
      },
    });

    return { message: 'Reacción añadida', action: 'ADDED', reaction };
  }
}
