import { Test, type TestingModule } from "@nestjs/testing";
import type { BotRequest } from "./interfaces/bot.interface";
import { MyBotService } from "./my-bot.service";

describe("MyBotService", () => {
	let service: MyBotService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [MyBotService],
		}).compile();

		service = module.get<MyBotService>(MyBotService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("process", () => {
		it("should return tool_calls when weather is mentioned and tool is available", async () => {
			const request: BotRequest = {
				messages: [{ role: "user", content: "what is the weather in London?" }],
				tools: [{ function: { name: "get_weather" } }],
			};
			const response = await service.process(request);
			expect(response.tool_calls).toBeDefined();
			expect(response.tool_calls[0].function.name).toEqual("get_weather");
		});

		it("should return a JSON string when in json mode", async () => {
			const request: BotRequest = {
				messages: [{ role: "user", content: "give me a json" }],
				isJsonMode: true,
			};
			const response = await service.process(request);
			expect(typeof response.content).toBe("string");
			expect(() => JSON.parse(response.content)).not.toThrow();
		});

		it("should return a standard text response", async () => {
			const request: BotRequest = {
				messages: [{ role: "user", content: "hello" }],
			};
			const response = await service.process(request);
			expect(response.content).toEqual(
				'[Internal Bot]: I received "hello". I am now simulating a stream.',
			);
		});
	});
});
