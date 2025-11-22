import { Module } from "@nestjs/common";
import { MyBotService } from "../bot/my-bot.service";
import { OpenAIController } from "./openai.controller";
import { OpenAIService } from "./openai.service";

@Module({
	controllers: [OpenAIController],
	providers: [OpenAIService, MyBotService],
})
export class OpenAIModule {}
