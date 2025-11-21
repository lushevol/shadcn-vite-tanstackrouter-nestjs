import { Injectable } from "@nestjs/common";
import type { Observable } from "rxjs";
import { endWith, map } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";
import { MyBotService } from "../bot/my-bot.service";
import { simulateStream } from "../common/utils/stream-simulator.util";
import { TextUtils } from "../common/utils/text-processing.util";
import type { CreateChatCompletionDto } from "./dto/chat-completion.dto";

@Injectable()
export class OpenAIService {
	constructor(private botService: MyBotService) {}

	async handleRequest(dto: CreateChatCompletionDto) {
		const reqId = `chatcmpl-${uuidv4()}`;
		const created = Math.floor(Date.now() / 1000);

		// 1. Call Internal Bot
		const botResponse = await this.botService.process({
			messages: dto.messages,
			tools: dto.tools,
			userId: dto.user,
			isJsonMode: dto.response_format?.type === "json_object",
		});

		// 2. Handle Tool Calls (Return Immediately - No Streaming)
		if (botResponse.tool_calls) {
			return {
				id: reqId,
				object: "chat.completion",
				created,
				model: dto.model,
				choices: [
					{
						index: 0,
						message: {
							role: "assistant",
							content: null,
							tool_calls: botResponse.tool_calls,
						},
						finish_reason: "tool_calls",
					},
				],
				usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
			};
		}

		// 3. Process Text (Stop Sequences)
		const cleanContent = TextUtils.applyStopSequences(
			botResponse.content || "",
			dto.stop,
		);

		// 4. Calculate Usage
		const usage = {
			prompt_tokens: TextUtils.estimateTokens(JSON.stringify(dto.messages)),
			completion_tokens: TextUtils.estimateTokens(cleanContent),
			total_tokens: 0, // Sum not needed for this mock
		};
		usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

		// 5. Return Stream or Static
		if (dto.stream) {
			return this.createStream(cleanContent, dto.model, reqId, created);
		} else {
			return {
				id: reqId,
				object: "chat.completion",
				created,
				model: dto.model,
				choices: [
					{
						index: 0,
						message: { role: "assistant", content: cleanContent },
						finish_reason: "stop",
					},
				],
				usage,
			};
		}
	}

	private createStream(
		content: string,
		model: string,
		id: string,
		created: number,
	): Observable<any> {
		return simulateStream(content).pipe(
			map((chunk) => ({
				id,
				object: "chat.completion.chunk",
				created,
				model,
				choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
			})),
			endWith("[DONE]"), // Magic string for OpenAI clients
		);
	}
}
