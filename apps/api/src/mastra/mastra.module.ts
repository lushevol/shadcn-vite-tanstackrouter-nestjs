import { Module } from "@nestjs/common";
import { MastraController } from "./mastra.controller";
import { MastraService } from "./mastra.service";

@Module({
	controllers: [MastraController],
	providers: [MastraService],
})
export class MastraModule {}
