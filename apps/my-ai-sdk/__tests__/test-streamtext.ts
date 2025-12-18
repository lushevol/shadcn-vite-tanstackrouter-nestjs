import { streamText } from "ai";
import { createCustomProvider } from "../src/provider";
import "dotenv/config";

async function testProvider() {
	const myProvider = createCustomProvider({
		baseURL: process.env.DEEPSEEK_BASE_URL, // Change this to your LLM API endpoint
		apiKey: process.env.DEEPSEEK_API_KEY,
	});

	const model = myProvider("deepseek-chat");

	const result = streamText({
		model,
		messages: [
			{
				role: "user",
				content: "Hello, how are you?",
			},
		],
	});

	const reader = result.fullStream.getReader();
	while (true) {
		const { value, done } = await reader.read();
        if (done) break;
        console.log(value);
	}
}

testProvider();
