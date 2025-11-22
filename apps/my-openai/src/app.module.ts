import { Module } from "@nestjs/common";
import { OpenAIModule } from "./openai/openai.module";
import { ResponsesModule } from "./responses/responses.module";

@Module({
	imports: [OpenAIModule, ResponsesModule],
})
export class AppModule {}
