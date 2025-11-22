import { Module } from "@nestjs/common";
import { MyBotService } from "../bot/my-bot.service";
import { ResponsesController } from "./responses.controller";
import { ResponsesService } from "./responses.service";

@Module({
	controllers: [ResponsesController],
	providers: [ResponsesService, MyBotService],
})
export class ResponsesModule {}
