import { Injectable, Logger } from "@nestjs/common";
import { ChatCompletionCreateParams } from "openai/resources";
import { Observable } from "rxjs";
import { endWith, finalize, map, tap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";
import { MyBotService } from "../bot/my-bot.service";
import { simulateStream } from "../common/utils/stream-simulator.util";
import { TextUtils } from "../common/utils/text-processing.util";

@Injectable()
export class OpenAIService {
	private readonly logger = new Logger(OpenAIService.name);

	constructor(private botService: MyBotService) {}

	async handleRequest(dto: ChatCompletionCreateParams) {
		const reqId = `chatcmpl-${uuidv4()}`;
		const created = Math.floor(Date.now() / 1000);

		// Log entry (short preview)
		try {
			const preview = JSON.stringify({
				model: dto.model,
				user: dto.user,
				messages: dto.messages?.slice?.(0, 2) ?? [],
			})
				.slice(0, 500)
				.replace(/\\n/g, "\\n");
			this.logger.log(`handleRequest start. reqId=${reqId} preview=${preview}`);
		} catch {
			this.logger.debug(`handleRequest start. reqId=${reqId} (preview failed)`);
		}

		// 1. Call Internal Bot
		this.logger.log(`Calling internal bot for reqId=${reqId}`);
		const botResponse = await this.botService.process({
			messages: dto.messages as Array<{ role: string; content: string }>,
			tools: dto.tools,
			userId: dto.user,
			isJsonMode: dto.response_format?.type === "json_object",
		});
		this.logger.log(`Bot response received for reqId=${reqId}`);

		// 2. Handle Tool Calls (Streamed Standard Format)
		if (botResponse.tool_calls) {
			this.logger.log(
				`Tool calls detected for reqId=${reqId}, returning standard stream`,
			);
			return this.createStandardToolStream(
				botResponse.tool_calls,
				dto.model,
				reqId,
				created,
			);
		}

		// 3. Process Text (Stop Sequences)
		const cleanContent = TextUtils.applyStopSequences(
			botResponse.content || "",
			dto.stop,
		);

		// 4. Return Stream or Static
		if (dto.stream) {
			this.logger.log(`Creating streaming response for reqId=${reqId}`);
			return this.createStream(cleanContent, dto.model, reqId, created);
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
						message: { role: "assistant", content: cleanContent },
						finish_reason: "stop",
					},
				],
				usage: {
					prompt_tokens: 0,
					completion_tokens: 0,
					total_tokens: 0,
				},
			};
		}
	}

	private createStandardToolStream(
		toolCalls: any[],
		model: string,
		id: string,
		created: number,
	): Observable<any> {
		return new Observable((subscriber) => {
			(async () => {
				// 1. Initial Chunk: Role + Tool Call Start
				const toolCall = toolCalls[0]; // Assuming single tool call
				const callId = toolCall.id;
				const name = toolCall.function.name;
				const args = toolCall.function.arguments;

				const initialChunk = {
					id,
					object: "chat.completion.chunk",
					created,
					model,
					choices: [
						{
							index: 0,
							delta: {
								role: "assistant",
								content: null,
								tool_calls: [
									{
										index: 0,
										id: callId,
										type: "function",
										function: {
											name: name,
											arguments: "",
										},
									},
								],
							},
							finish_reason: null,
						},
					],
				};
				subscriber.next(initialChunk);
				await this.sleep(10);

				// 2. Stream Arguments
				const chunkSize = 5;
				for (let i = 0; i < args.length; i += chunkSize) {
					const chunkArg = args.slice(i, i + chunkSize);
					const argChunk = {
						id,
						object: "chat.completion.chunk",
						created,
						model,
						choices: [
							{
								index: 0,
								delta: {
									tool_calls: [
										{
											index: 0,
											function: {
												arguments: chunkArg,
											},
										},
									],
								},
								finish_reason: null,
							},
						],
					};
					subscriber.next(argChunk);
					await this.sleep(5);
				}

				// 3. Finish Chunk
				const finishChunk = {
					id,
					object: "chat.completion.chunk",
					created,
					model,
					choices: [
						{
							index: 0,
							delta: {},
							finish_reason: "tool_calls",
						},
					],
				};
				subscriber.next(finishChunk);
				subscriber.next("[DONE]");
				subscriber.complete();
			})();
		});
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

	private sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
