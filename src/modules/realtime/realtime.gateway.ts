import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { UserStatus } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader =
        client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!authHeader) {
        this.logger.warn(`Cliente ${client.id} desconectado por falta de token de autenticación`);
        client.disconnect();
        return;
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, username: true, displayName: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;

      // Track active user sockets
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id).add(client.id);

      // Update user status in DB and broadcast ONLINE presence
      await this.prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.ONLINE },
      });

      this.server.emit('user:presence', {
        userId: user.id,
        status: UserStatus.ONLINE,
      });

      this.logger.log(`Usuario conectado: ${user.username} (${client.id})`);
    } catch (error) {
      this.logger.error(`Error de autenticación WebSocket: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data?.user;
    if (user) {
      const sockets = this.userSockets.get(user.id);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(user.id);

          // Update status to OFFLINE
          await this.prisma.user.update({
            where: { id: user.id },
            data: { status: UserStatus.OFFLINE },
          });

          this.server.emit('user:presence', {
            userId: user.id,
            status: UserStatus.OFFLINE,
          });
        }
      }
      this.logger.log(`Usuario desconectado: ${user.username} (${client.id})`);
    }
  }

  @SubscribeMessage('channel:join')
  handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    const roomName = `channel_${data.channelId}`;
    client.join(roomName);
    this.logger.log(`Socket ${client.id} se unió a la sala: ${roomName}`);
    return { event: 'channel:joined', room: roomName };
  }

  @SubscribeMessage('channel:leave')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    const roomName = `channel_${data.channelId}`;
    client.leave(roomName);
    return { event: 'channel:left', room: roomName };
  }

  @SubscribeMessage('direct_chat:join')
  handleJoinDirectChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const roomName = `direct_chat_${data.chatId}`;
    client.join(roomName);
    this.logger.log(`Socket ${client.id} se unió al chat directo: ${roomName}`);
    return { event: 'direct_chat:joined', room: roomName };
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId?: string; directChatId?: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    if (data.channelId) {
      client.to(`channel_${data.channelId}`).emit('user:typing', {
        channelId: data.channelId,
        user: { id: user.id, displayName: user.displayName, username: user.username },
        isTyping: true,
      });
    } else if (data.directChatId) {
      client.to(`direct_chat_${data.directChatId}`).emit('user:typing', {
        directChatId: data.directChatId,
        user: { id: user.id, displayName: user.displayName, username: user.username },
        isTyping: true,
      });
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channelId?: string; directChatId?: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    if (data.channelId) {
      client.to(`channel_${data.channelId}`).emit('user:typing', {
        channelId: data.channelId,
        user: { id: user.id, displayName: user.displayName, username: user.username },
        isTyping: false,
      });
    } else if (data.directChatId) {
      client.to(`direct_chat_${data.directChatId}`).emit('user:typing', {
        directChatId: data.directChatId,
        user: { id: user.id, displayName: user.displayName, username: user.username },
        isTyping: false,
      });
    }
  }

  // Method to emit new messages from MessagesService or anywhere in backend
  emitNewMessage(message: any) {
    if (message.channelId) {
      this.server.to(`channel_${message.channelId}`).emit('message:new', message);
    }
    if (message.directChatId) {
      this.server.to(`direct_chat_${message.directChatId}`).emit('message:new', message);
    }
  }
}
