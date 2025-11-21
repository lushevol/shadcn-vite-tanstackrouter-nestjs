import { createOpenAI } from "@ai-sdk/openai";

export const openai = createOpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL!,
  apiKey: process.env.DEEPSEEK_API_KEY!,
});