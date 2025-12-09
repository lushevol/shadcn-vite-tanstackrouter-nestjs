import { createOpenAI } from '@ai-sdk/openai';
import { Controller, Post, Req, Res } from '@nestjs/common';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import type { Request, Response } from 'express';

const openai = createOpenAI({
  name: "openai",
  baseURL: process.env.DEEPSEEK_API_BASE_URL!,
  apiKey: process.env.DEEPSEEK_API_KEY!,
})

@Controller('api')
export class AiSdkController {
  @Post("/chat")
  async chat(@Req() req: Request, @Res() res: Response) {
    const { messages }: { messages: UIMessage[] } = req.body;
    const result = streamText({
      model: openai.chat("deepseek-chat"),
      messages: convertToModelMessages(messages),
    });

    result.pipeUIMessageStreamToResponse(res);
  }
}
