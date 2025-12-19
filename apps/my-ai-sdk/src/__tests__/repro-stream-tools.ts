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
          inputSchema: z.object({
            location: z.string(),
          }),
          outputSchema: z.object({
            location: z.string(),
            temperature: z.number(),
            condition: z.string(),
          }),
          execute: async ({ location }) => {
            console.log(`[Tool Executed] weatherTool called with location: ${location}`);
            return {
              location,
              temperature: 72,
              condition: "Sunny",
            };
          },
          onInputAvailable(options) {
            console.log(`[Tool Input Available] weatherTool called with location: ${options.input.location}`);
          },
          onInputDelta(options) {
            console.log(`[Tool Input Delta] weatherTool called with location: ${options.inputTextDelta}`);
          },
          onInputStart(options) {
            console.log(`[Tool Input Start] weatherTool called with location: ${options.messages}`);
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
