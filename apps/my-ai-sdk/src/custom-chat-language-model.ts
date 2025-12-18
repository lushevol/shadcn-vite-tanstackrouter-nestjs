import {
	APICallError,
	type LanguageModelV2,
	type LanguageModelV2CallOptions,
	type LanguageModelV2CallWarning,
	type LanguageModelV2Content,
	type LanguageModelV2FinishReason,
	type LanguageModelV2FunctionTool,
	type LanguageModelV2Prompt,
	type LanguageModelV2ProviderDefinedTool,
	type LanguageModelV2StreamPart,
} from "@ai-sdk/provider";
import type {
	ChatCompletion,
	ChatCompletionChunk,
	ChatCompletionCreateParams,
	ChatCompletionMessageToolCall,
	ChatCompletionTool,
} from "openai/resources.mjs";
import type { CustomChatSettings } from "./provider";

export interface CustomChatConfig {
	provider: string;
	baseURL: string;
	headers: () => Record<string, string>;
	generateId: () => string;
}

export class CustomChatLanguageModel implements LanguageModelV2 {
	readonly specificationVersion = "v2";
	readonly provider: string;
	readonly modelId: string;
	readonly config: CustomChatConfig;

	constructor(
		modelId: string,
		settings: CustomChatSettings,
		config: CustomChatConfig,
	) {
		this.provider = config.provider;
		this.modelId = modelId;
		this.config = config;
	}

	private getArgs(options: LanguageModelV2CallOptions): {
		args: ChatCompletionCreateParams;
		warnings: LanguageModelV2CallWarning[];
	} {
		const warnings: LanguageModelV2CallWarning[] = [];

		const messages = this.convertToProviderMessages(options.prompt);

		const tools = options.tools
			? this.prepareTools(options.tools) // Simplified tool handling for now
			: undefined;

		const response_format = options.responseFormat
			? this.prepareResponseFormat(options.responseFormat)
			: undefined;

		const body = {
			model: this.modelId,
			messages,
			temperature: options.temperature,
			max_completion_tokens: options.maxOutputTokens,
			stop: options.stopSequences,
			tools,
			stream: false,
			response_format,
		} satisfies ChatCompletionCreateParams;

		return { args: body, warnings };
	}

	private prepareResponseFormat(
		responseFormat: LanguageModelV2CallOptions["responseFormat"],
	): ChatCompletionCreateParams["response_format"] {
		if (responseFormat?.type === "json") {
			return {
				type: "json_schema",
				json_schema: {
					name: responseFormat.name ?? "",
					description: responseFormat.description,
					// @ts-expect-error
					schema: responseFormat.schema,
				},
			};
		}
		return responseFormat;
	}

	private prepareTools(
		tools: (LanguageModelV2FunctionTool | LanguageModelV2ProviderDefinedTool)[],
	): ChatCompletionTool[] {
		return tools.map((tool) => {
			if (tool.type === "function") {
				return {
					type: "function",
					function: {
						name: tool.name,
						description: tool.description,
						parameters: tool.inputSchema as Record<string, unknown>,
					},
				};
			}
			return {
				type: "function",
				function: {
					name: tool.name,
					description: "",
					parameters: tool.args,
				},
			};
		});
	}

	async doGenerate(options: LanguageModelV2CallOptions) {
		const { args, warnings } = this.getArgs(options);

		const response = await fetch(`${this.config.baseURL}/chat/completions`, {
			method: "POST",
			headers: {
				...this.config.headers(),
				"Content-Type": "application/json",
			},
			body: JSON.stringify(args),
			signal: options.abortSignal,
		});

		if (!response.ok) {
			this.handleError(response);
		}

		const responseBody = (await response.json()) as ChatCompletion;

		const content: LanguageModelV2Content[] = [];

		if (responseBody.choices?.[0]?.message?.content) {
			content.push({
				type: "text",
				text: responseBody.choices[0].message.content,
			});
		}

		if (responseBody.choices?.[0]?.message?.tool_calls) {
			for (const toolCall of responseBody.choices[0].message.tool_calls) {
				const args =
					typeof toolCall.function.arguments === "string"
						? toolCall.function.arguments
						: JSON.stringify(toolCall.function.arguments);

				content.push({
					type: "tool-call",
					toolCallId: toolCall.id,
					toolName: toolCall.function.name,
					input: args,
				});
			}
		}

		return {
			content,
			finishReason: this.mapFinishReason(
				responseBody.choices?.[0]?.finish_reason,
			),
			usage: {
				inputTokens: responseBody.usage?.prompt_tokens,
				outputTokens: responseBody.usage?.completion_tokens,
				totalTokens: responseBody.usage?.total_tokens,
			},
			request: { body: JSON.stringify(args) },
			response: { body: JSON.stringify(responseBody) },
			warnings,
		};
	}

	async doStream(options: LanguageModelV2CallOptions) {
		const { args, warnings } = this.getArgs(options);

		const response = await fetch(`${this.config.baseURL}/chat/completions`, {
			method: "POST",
			headers: {
				...this.config.headers(),
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ...args, stream: true }),
			signal: options.abortSignal,
		});

		if (!response.ok) {
			this.handleError(response);
		}

		if (!response.body) {
			throw new APICallError({
				message: "Response body is empty",
				statusCode: response.status,
				url: response.url,
				requestBodyValues: {},
				isRetryable: true,
			});
		}

		const stream = response.body
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(this.createParser())
			.pipeThrough(this.createTransformer(warnings));

		return { stream, warnings };
	}

	private createParser(): TransformStream<string, ChatCompletionChunk> {
		let buffer = "";
		return new TransformStream({
			transform(chunk, controller) {
				buffer += chunk;
				const lines = buffer.split("\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed || trimmed === "data: [DONE]") continue;
					if (trimmed.startsWith("data: ")) {
						try {
							const json = JSON.parse(trimmed.slice(6)) as ChatCompletionChunk;
							controller.enqueue(json);
						} catch (e) {
							// Ignore parse errors for partial lines
						}
					}
				}
			},
		});
	}

	private createTransformer(warnings: LanguageModelV2CallWarning[]) {
		let isFirstChunk = true;
		const self = this;
		const toolCallIds = new Map<number, string>();

		return new TransformStream<ChatCompletionChunk, LanguageModelV2StreamPart>({
			async transform(chunk, controller) {
				if (isFirstChunk) {
					controller.enqueue({ type: "stream-start", warnings });
					isFirstChunk = false;
				}

				if (chunk.choices?.[0]?.delta?.content) {
					controller.enqueue({
						type: "text-delta",
						id: chunk.id || "",
						delta: chunk.choices[0].delta.content,
					});
				}

				if (chunk.choices?.[0]?.delta?.tool_calls) {
					for (const toolCall of chunk.choices[0].delta.tool_calls) {
						const index = toolCall.index;

						if (toolCall.id) {
							toolCallIds.set(index, toolCall.id);
							if (toolCall.function?.name) {
								controller.enqueue({
									type: "tool-input-start",
									toolName: toolCall.function.name,
									id: toolCall.id,
								});
							}
						}

						const id = toolCallIds.get(index);

						if (id && toolCall.function?.arguments) {
							controller.enqueue({
								type: "tool-input-delta",
								id: id,
								delta: toolCall.function.arguments,
							});
						}
					}
				}

				if (chunk.choices?.[0]?.finish_reason) {
					controller.enqueue({
						type: "finish",
						finishReason: self.mapFinishReason(chunk.choices[0].finish_reason),
						usage: {
							inputTokens: chunk.usage?.prompt_tokens,
							outputTokens: chunk.usage?.completion_tokens,
							totalTokens: chunk.usage?.total_tokens,
						},
					});
				}
			},
		});
	}

	private convertToProviderMessages(
		prompt: LanguageModelV2Prompt,
	): ChatCompletionCreateParams["messages"] {
		const messages: ChatCompletionCreateParams["messages"] = [];

		for (const message of prompt) {
			switch (message.role) {
				case "system":
					messages.push({ role: "system", content: message.content });
					break;

				case "user":
					messages.push({
						role: "user",
						content: message.content.map((part) => {
							switch (part.type) {
								case "text":
									return { type: "text", text: part.text };
								case "file":
									return {
										type: "image_url",
										image_url: {
											url: this.convertFileToUrl(part.data, part.mediaType),
										},
									};
								default: {
									const _exhaustiveCheck = part;
									throw new Error(`Unsupported part type: ${_exhaustiveCheck}`);
								}
							}
						}),
					});
					break;

				case "assistant": {
					let content: string | null = null;
					const tool_calls: ChatCompletionMessageToolCall[] = [];

					for (const part of message.content) {
						if (part.type === "text") {
							content = part.text;
						} else if (part.type === "tool-call") {
							tool_calls.push({
								id: part.toolCallId,
								type: "function",
								function: {
									name: part.toolName,
									arguments: JSON.stringify(part.input),
								},
							});
						}
					}

					messages.push({
						role: "assistant",
						content,
						tool_calls: tool_calls.length > 0 ? tool_calls : undefined,
					});
					break;
				}

				case "tool":
					for (const part of message.content) {
						messages.push({
							role: "tool",
							tool_call_id: part.toolCallId,
							content: JSON.stringify(part.output),
						});
					}
					break;

				default: {
					const _exhaustiveCheck = message;
					throw new Error(`Unsupported message role: ${_exhaustiveCheck}`);
				}
			}
		}

		return messages;
	}

	private convertFileToUrl(
		data: string | Uint8Array | URL,
		mediaType: string,
	): string {
		if (data instanceof URL) {
			return data.toString();
		}
		if (typeof data === "string") {
			// Assuming base64 string if not URL
			return `data:${mediaType};base64,${data}`;
		}
		if (data instanceof Uint8Array) {
			const base64 = Buffer.from(data).toString("base64");
			return `data:${mediaType};base64,${base64}`;
		}
		throw new Error("Unsupported file data type");
	}

	private mapFinishReason(
		reason: string | undefined,
	): LanguageModelV2FinishReason {
		switch (reason) {
			case "stop":
				return "stop";
			case "length":
				return "length";
			case "content_filter":
				return "content-filter";
			case "tool_calls":
				return "tool-calls";
			default:
				return "other";
		}
	}

	private handleError(error: Response): never {
		const status = error.status;

		if (status === 429) {
			throw new APICallError({
				message: "Too many requests",
				statusCode: status,
				url: error.url,
				requestBodyValues: {},
				isRetryable: true,
			});
		}

		throw new APICallError({
			message: `API call failed with status ${status}`,
			statusCode: status,
			url: error.url,
			requestBodyValues: {}, // Placeholder
			isRetryable: status >= 500 && status < 600,
		});
	}

	get supportedUrls() {
		return {
			"image/*": [/^https:\/\/example\.com\/images\/.*/],
		};
	}
}
