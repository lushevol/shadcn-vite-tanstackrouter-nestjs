import { Controller, Post, Req, Res } from '@nestjs/common';
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from 'ai';
import type { Request, Response } from 'express';
import { createCustomProvider } from 'my-ai-sdk';
import { Public } from '../auth/decorators/public.decorator';
import { z } from 'zod';
import 'dotenv/config';
const openai = createCustomProvider({
  baseURL: process.env.DEEPSEEK_BASE_URL!,
  apiKey: process.env.DEEPSEEK_API_KEY!,
})

@Public()
@Controller('api')
export class AiSdkController {
  @Post("/chat")
  async chat(@Req() req: Request, @Res() res: Response) {
    const { messages }: { messages: UIMessage[] } = req.body;
    console.log(`[AiSdkController.chat] messages:`, JSON.stringify(messages, null, 2));
    const result = streamText({
      model: openai.languageModel("deepseek-chat"),
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(2),
      tools: {
        weatherTool: {
          description: "Get the weather for a specific location",
          inputSchema: z.object({
            location: z.string(),
          }),
          execute: async (args: { location: string }) => {
            return {
              type: "text",
              text: "The weather in " + args.location + " is sunny.",
            };
          },
        },
      }
    });

    result.pipeUIMessageStreamToResponse(res);
  }
}
