import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';

@Injectable()
export class DirectChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateDirectChat(currentUserId: string, dto: CreateDirectChatDto) {
    if (currentUserId === dto.recipientId) {
      throw new BadRequestException('No puedes iniciar una conversación directa contigo mismo');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });

    if (!recipient) {
      throw new NotFoundException('El usuario destinatario no existe');
    }

    // Check if a direct chat between these two users already exists
    const existingChat = await this.prisma.directChat.findFirst({
      where: {
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: dto.recipientId } } },
        ],
      },
      include: {
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
      },
    });

    if (existingChat) {
      return {
        message: 'Chat directo existente recuperado',
        directChat: existingChat,
      };
    }

    // Create new direct chat
    const newChat = await this.prisma.directChat.create({
      data: {
        members: {
          create: [{ userId: currentUserId }, { userId: dto.recipientId }],
        },
      },
      include: {
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
      },
    });

    return {
      message: 'Chat directo iniciado exitosamente',
      directChat: newChat,
    };
  }

  async getMyDirectChats(userId: string) {
    const chats = await this.prisma.directChat.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
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
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
            messageType: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats.map((chat) => {
      const otherMember = chat.members.find((m) => m.userId !== userId)?.user;
      return {
        id: chat.id,
        recipient: otherMember,
        lastMessage: chat.messages[0] || null,
        updatedAt: chat.updatedAt,
      };
    });
  }

  async getDirectChatById(chatId: string, userId: string) {
    const chat = await this.prisma.directChat.findUnique({
      where: { id: chatId },
      include: {
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
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat directo no encontrado');
    }

    const isMember = chat.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new BadRequestException('No tienes acceso a esta conversación');
    }

    return chat;
  }
}
