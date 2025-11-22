import { Injectable, Logger } from "@nestjs/common";
import {
	EasyInputMessage,
	ResponseCreateParams,
} from "openai/resources/responses/responses";
import { Observable } from "rxjs";
import { endWith, finalize, map, tap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";
import { MyBotService } from "../bot/my-bot.service";
import { simulateStream } from "../common/utils/stream-simulator.util";
import { TextUtils } from "../common/utils/text-processing.util";

@Injectable()
export class ResponsesService {
	private readonly logger = new Logger(ResponsesService.name);

	constructor(private botService: MyBotService) {}

	async handleRequest(dto: ResponseCreateParams) {
		const reqId = `chatcmpl-${uuidv4()}`;
		const created = Math.floor(Date.now() / 1000);

		// Log entry (short preview)
		try {
			const preview = JSON.stringify({
				model: dto.model,
				user: dto.user,
				input: Array.isArray(dto.input)
					? (dto.input as any).slice(0, 2)
					: dto.input,
			}).slice(0, 500);
			this.logger.log(`handleRequest start. reqId=${reqId} preview=${preview}`);
		} catch {
			this.logger.debug(`handleRequest start. reqId=${reqId} (preview failed)`);
		}

		// 1. Call Internal Bot
		const messages = (
			Array.isArray(dto.input)
				? dto.input.map((i: EasyInputMessage) => {
						if (typeof i.content === "string") {
							return i as { role: string; content: string };
						} else if (
							Array.isArray(i.content) &&
							i.content.every((c) => c.type === "input_text")
						) {
							const textContent = i.content.map((c) => c.text)?.join("") || "";
							return { role: i.role, content: textContent };
						} else {
							return { role: i.role, content: i.content };
						}
					})
				: [{ role: "user", content: dto.input }]
		) as Array<{ role: string; content: string }>;

		this.logger.log(`Calling internal bot for reqId=${reqId}`);
		const botResponse = await this.botService.process({
			messages: messages,
			tools: dto.tools,
			userId: dto.user,
			isJsonMode: dto.text?.format.type === "json_object",
		});
		this.logger.log(`Bot response received for reqId=${reqId}`);

		// 2. Handle Tool Calls (Return Immediately - No Streaming)
		if (botResponse.tool_calls) {
			this.logger.log(
				`Tool calls detected for reqId=${reqId}, returning tool_calls payload`,
			);
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

		// // 3. Process Text (Stop Sequences)
		// // Respect stop tokens provided by the client (string or string[]).
		// const stopParam = (dto as any).stop ?? dto.text?.stop ?? undefined;
		// let stopSequences: string | string[] = "";
		// if (typeof stopParam === "string") {
		// 	stopSequences = stopParam;
		// } else if (Array.isArray(stopParam) && stopParam.length > 0) {
		// 	stopSequences = stopParam;
		// }
		// const cleanContent = TextUtils.applyStopSequences(
		// 	botResponse.content || "",
		// 	stopSequences,
		// );

		// 4. Calculate Usage
		const usage = {
			prompt_tokens: TextUtils.estimateTokens(JSON.stringify(messages)),
			completion_tokens: TextUtils.estimateTokens(botResponse.content || ""),
			total_tokens: 0, // Sum not needed for this mock
		};
		usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;
		this.logger.log(
			`Usage for reqId=${reqId}: prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens}`,
		);

		// 5. Return Stream or Static
		if (dto.stream) {
			this.logger.log(`Creating streaming response for reqId=${reqId}`);
			return this.createStream(
				botResponse.content || "",
				dto.model,
				reqId,
				created,
			);
		} else {
			this.logger.log(`Returning static JSON response for reqId=${reqId}`);
			return {
				id: reqId,
				object: "chat.completion",
				created,
				model: dto.model,
				choices: [
					{
						index: 0,
						message: { role: "assistant", content: botResponse.content || "" },
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
			tap((chunk) => {
				try {
					const preview = String(chunk).slice(0, 300);
					this.logger.debug(`Stream chunk for id=${id}: ${preview}`);
				} catch {
					this.logger.debug(`Stream chunk for id=${id} (preview failed)`);
				}
			}),
			map((chunk) => ({
				id,
				object: "chat.completion.chunk",
				created,
				model,
				choices: [{ index: 0, delta: { content: chunk }, finish_reason: null }],
			})),
			endWith("[DONE]"), // Magic string for OpenAI clients
			finalize(() =>
				this.logger.log(`Stream observable finalized for id=${id}`),
			),
		);
	}
}
