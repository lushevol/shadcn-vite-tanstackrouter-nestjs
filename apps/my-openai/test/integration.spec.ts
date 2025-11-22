import { createOpenAI } from "@ai-sdk/openai";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { streamText } from "ai";
import { AppModule } from "../src/app.module";

describe("OpenAI Integration", () => {
	let app: INestApplication;
	let server: any;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.listen(0);
		server = app.getHttpServer();
	});

	afterAll(async () => {
		await app.close();
	});

	it("should get a streaming response from the mock api", async () => {
		const openai = createOpenAI({
			baseURL: `http://127.0.0.1:${server.address().port}/v1`,
			apiKey: "test",
		});

		const { textStream } = streamText({
			model: openai("gpt-4"),
			prompt: "hello",
		});
		const reader = textStream.getReader();
		let result = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			result += value;
		}

		expect(result).toContain(
			'[Internal Bot]: I received "hello". I am now simulating a stream.',
		);
	});
});
