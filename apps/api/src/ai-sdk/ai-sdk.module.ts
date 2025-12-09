import { Module } from "@nestjs/common";
import { AiSdkController } from "./ai-sdk.controller";

@Module({
	controllers: [AiSdkController],
})
export class AiSdkModule {}
