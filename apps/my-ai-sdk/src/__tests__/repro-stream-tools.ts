import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import { createCustomProvider } from "../provider";
import "dotenv/config";

async function runReproduction() {
  const custom = createCustomProvider({
    baseURL: process.env.DEEPSEEK_BASE_URL,
    apiKey: process.env.DEEPSEEK_API_KEY,
  });

  const model = custom("deepseek-chat");

  console.log("--- Starting Reproduction Test ---");

  try {
    const result = streamText({
      model,
      stopWhen: stepCountIs(5),
      prompt: "What is the weather in San Francisco?",
      tools: {
        weatherTool: tool({
          description: "Get the weather in a location",
          parameters: z.object({
            location: z.string().describe("The location to get the weather for"),
          }),
          // @ts-expect-error
          execute: async ({ location }: { location: string }) => {
            console.log(`[Tool Executed] weatherTool called with location: ${location}`);
            return {
              location,
              temperature: 72,
              condition: "Sunny",
            };
          },
        }),
      },
    });

    for await (const part of result.fullStream) {
      console.log("Stream part:", JSON.stringify(part));
    }

    console.log("--- Stream Finished ---");
  } catch (error) {
    console.error("--- Stream Error ---", error);
  }
}

runReproduction();
