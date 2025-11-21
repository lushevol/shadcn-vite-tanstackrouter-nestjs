import { Test, type TestingModule } from "@nestjs/testing";
import type { Response } from "express";
import { of } from "rxjs";
import { CreateChatCompletionDto } from "./dto/chat-completion.dto";
import { OpenAIController } from "./openai.controller";
import { OpenAIService } from "./openai.service";

describe("OpenAIController", () => {
	let controller: OpenAIController;
	let service: OpenAIService;

	const mockOpenAIService = {
		handleRequest: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [OpenAIController],
			providers: [
				{
					provide: OpenAIService,
					useValue: mockOpenAIService,
				},
			],
		}).compile();

		controller = module.get<OpenAIController>(OpenAIController);
		service = module.get<OpenAIService>(OpenAIService);
	});

	it("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("chatCompletions", () => {
		it("should return a json response when service returns a plain object", async () => {
			const dto = new CreateChatCompletionDto();
			const result = { id: "123", content: "hello" };
			mockOpenAIService.handleRequest.mockResolvedValue(result);

			const res = {
				json: jest.fn(),
			} as unknown as Response;

			await controller.chatCompletions(dto, res);

			expect(service.handleRequest).toHaveBeenCalledWith(dto);
			expect(res.json).toHaveBeenCalledWith(result);
		});

		it("should return a stream response when service returns an observable", async () => {
			const dto = new CreateChatCompletionDto();
			const result = of({ id: "123", content: "hello" });
			mockOpenAIService.handleRequest.mockResolvedValue(result);

			const res = {
				setHeader: jest.fn(),
				write: jest.fn(),
				end: jest.fn(),
			} as unknown as Response;

			await controller.chatCompletions(dto, res);

			expect(service.handleRequest).toHaveBeenCalledWith(dto);
			expect(res.setHeader).toHaveBeenCalledWith(
				"Content-Type",
				"text/event-stream",
			);
		});
	});
});
