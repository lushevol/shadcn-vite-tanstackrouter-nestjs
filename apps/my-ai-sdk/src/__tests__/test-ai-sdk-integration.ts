import { generateObject, generateText, streamText, tool } from "ai";
import { z } from "zod";
import { createCustomProvider } from "../provider";
import "dotenv/config";
import { stepCountIs } from "ai";

async function testAiSdkIntegration() {
	const custom = createCustomProvider({
		baseURL: process.env.DEEPSEEK_BASE_URL,
		apiKey: process.env.DEEPSEEK_API_KEY,
	});
	const model = custom("deepseek-chat");

	console.log("--- Testing generateText ---");
	try {
		const { text } = await generateText({
			model,
			prompt: "What is 2+2?",
		});
		console.log("generateText result:", text);
	} catch (e) {
		console.error("generateText failed:", e);
	}

	console.log("\n--- Testing streamText ---");
	try {
		const result = await streamText({
			model,
			prompt: "Count to 5.",
		});

		console.log("streamText result:");
		for await (const delta of result.textStream) {
			process.stdout.write(delta);
		}
		console.log();
	} catch (e) {
		console.error("streamText failed:", e);
	}

	console.log("\n--- Testing generateObject ---");
	try {
		const { object } = await generateObject({
			model,
			schema: z.object({
				recipe: z.object({
					name: z.string(),
					ingredients: z.array(z.string()),
					steps: z.array(z.string()),
				}),
			}),
			prompt: "Generate a cookie recipe.",
		});
		console.log("generateObject result:", JSON.stringify(object, null, 2));
	} catch (e) {
		console.error("generateObject failed:", e);
		if (e instanceof Error && "cause" in e) {
			console.error("Cause:", (e as any).cause);
		}
		if (e instanceof Error && "text" in e) {
			console.error("Generated text:", (e as any).text);
		}
		if (e instanceof Error && "response" in e) {
			console.error("Response:", JSON.stringify((e as any).response, null, 2));
		}
	}

	console.log("\n--- Testing Tools ---");
	try {
		const { text, toolCalls } = await generateText({
			model,
			stopWhen: stepCountIs(5),
			prompt: "What is the weather in San Francisco?",
			tools: {
				weather: tool({
					description: "Get the weather in a location",
					inputSchema: z.object({
						location: z
							.string()
							.describe("The location to get the weather for"),
					}),
					execute: async ({ location }: { location: string }) => ({
						location,
						temperature: 72 + Math.floor(Math.random() * 21) - 10,
					}),
				}),
			},
		});
		console.log("Tool call response text:", text);
		console.log("Tool calls:", JSON.stringify(toolCalls, null, 2));
	} catch (e) {
		console.error("Tools failed:", e);
	}
}

testAiSdkIntegration().catch(console.error);
