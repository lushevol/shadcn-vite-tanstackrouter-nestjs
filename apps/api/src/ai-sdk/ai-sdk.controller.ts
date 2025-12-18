import { Controller, Post, Req, Res } from '@nestjs/common';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import type { Request, Response } from 'express';
import { createCustomProvider } from 'my-ai-sdk';

const openai = createCustomProvider({
  baseURL: process.env.DEEPSEEK_API_BASE_URL!,
  apiKey: process.env.DEEPSEEK_API_KEY!,
})

@Controller('api')
export class AiSdkController {
  @Post("/chat")
  async chat(@Req() req: Request, @Res() res: Response) {
    const { messages }: { messages: UIMessage[] } = req.body;
    const result = streamText({
      model: openai.languageModel("deepseek-chat"),
      messages: convertToModelMessages(messages),
    });

    result.pipeUIMessageStreamToResponse(res);
  }
}
