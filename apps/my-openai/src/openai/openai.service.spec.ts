import { Test, type TestingModule } from "@nestjs/testing";
import { of } from "rxjs";
import { MyBotService } from "../bot/my-bot.service";
import { CreateChatCompletionDto } from "./dto/chat-completion.dto";
import { OpenAIService } from "./openai.service";

interface ChatCompletion {
	choices: {
		finish_reason: string;
		message: {
			tool_calls: any[];
			content?: string;
		};
	}[];
}

describe("OpenAIService", () => {
	let service: OpenAIService;
	let botService: MyBotService;

	const mockMyBotService = {
		process: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				OpenAIService,
				{
					provide: MyBotService,
					useValue: mockMyBotService,
				},
			],
		}).compile();

		service = module.get<OpenAIService>(OpenAIService);
		botService = module.get<MyBotService>(MyBotService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("handleRequest", () => {
		it("should return tool_calls when bot service returns tool_calls", async () => {
			const dto = new CreateChatCompletionDto();
			dto.messages = [{ role: "user", content: "test" }];
			const botResponse = {
				tool_calls: [{ id: "1", function: { name: "get_weather" } }],
			};
			mockMyBotService.process.mockResolvedValue(botResponse);

			const result = (await service.handleRequest(dto)) as ChatCompletion;
			expect(result.choices[0].finish_reason).toEqual("tool_calls");
			expect(result.choices[0].message.tool_calls).toEqual(
				botResponse.tool_calls,
			);
		});

		it("should return a static response when stream is false", async () => {
			const dto = new CreateChatCompletionDto();
			dto.stream = false;
			dto.messages = [{ role: "user", content: "test" }];
			const botResponse = { content: "hello" };
			mockMyBotService.process.mockResolvedValue(botResponse);

			const result = (await service.handleRequest(dto)) as ChatCompletion;
			expect(result.choices[0].message.content).toEqual("hello");
		});

		it("should return an observable when stream is true", async () => {
			const dto = new CreateChatCompletionDto();
			dto.stream = true;
			dto.messages = [{ role: "user", content: "test" }];
			const botResponse = { content: "hello" };
			mockMyBotService.process.mockResolvedValue(botResponse);

			const result = await service.handleRequest(dto);
			expect(result).toBeInstanceOf(of().constructor);
		});
	});
});
