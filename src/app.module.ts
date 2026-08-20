import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';

// Database & Core
import { PrismaModule } from './database/prisma.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

// Application Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { DirectChatsModule } from './modules/direct-chats/direct-chats.module';
import { MessagesModule } from './modules/messages/messages.module';
import { FilesModule } from './modules/files/files.module';
import { HealthModule } from './modules/health/health.module';

// Global Guards, Filters & Interceptors
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    AdminModule,
    CommunitiesModule,
    ChannelsModule,
    DirectChatsModule,
    MessagesModule,
    FilesModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
