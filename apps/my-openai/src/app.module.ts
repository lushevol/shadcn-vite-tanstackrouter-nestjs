import { Module } from '@nestjs/common';
import { OpenAIController } from './openai/openai.controller';
import { OpenAIService } from './openai/openai.service';
import { MyBotService } from './bot/my-bot.service';

@Module({
  controllers: [OpenAIController],
  providers: [OpenAIService, MyBotService],
})
export class AppModule {}
