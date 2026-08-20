import { Module } from '@nestjs/common';
import { DirectChatsService } from './direct-chats.service';
import { DirectChatsController } from './direct-chats.controller';

@Module({
  controllers: [DirectChatsController],
  providers: [DirectChatsService],
  exports: [DirectChatsService],
})
export class DirectChatsModule {}
