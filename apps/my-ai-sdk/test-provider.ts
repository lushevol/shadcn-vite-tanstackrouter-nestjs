import { createCustomProvider } from "./src/provider";
import "dotenv/config";

async function testProvider() {
	const myProvider = createCustomProvider({
		baseURL: process.env.DEEPSEEK_BASE_URL, // Change this to your LLM API endpoint
		apiKey: process.env.DEEPSEEK_API_KEY,
	});

	const model = myProvider("deepseek-chat");

	console.log("Testing doGenerate...");
	try {
		const result = await model.doGenerate({
			inputFormat: "prompt",
			mode: { type: "regular" },
			prompt: [
				{ role: "user", content: [{ type: "text", text: "Hello, world!" }] },
			],
			abortSignal: undefined,
		} as any); // Casting to any because some options might be missing in this simple test
		console.log("doGenerate result:", JSON.stringify(result, null, 2));
	} catch (error) {
		console.error("doGenerate error:", error);
	}

	console.log("\nTesting doStream...");
	try {
		const result = await model.doStream({
			inputFormat: "prompt",
			mode: { type: "regular" },
			prompt: [
				{ role: "user", content: [{ type: "text", text: "Tell me a story." }] },
			],
			abortSignal: undefined,
		} as any);

		const reader = result.stream.getReader();
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			console.log("Stream chunk:", JSON.stringify(value));
		}
	} catch (error) {
		console.error("doStream error:", error);
	}
}

testProvider();
