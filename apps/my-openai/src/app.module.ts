import { Module } from "@nestjs/common";
import { MyBotService } from "./bot/my-bot.service";
import { OpenAIController } from "./openai/openai.controller";
import { OpenAIService } from "./openai/openai.service";

@Module({
	controllers: [OpenAIController],
	providers: [OpenAIService, MyBotService],
})
export class AppModule {}
