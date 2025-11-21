import { CopilotRuntime, copilotRuntimeNestEndpoint, OpenAIAdapter } from '@copilotkit/runtime';
import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import OpenAI from 'openai';
import { Public } from '../auth/decorators/public.decorator';
import { MastraService } from './mastra.service';
import 'dotenv/config';

const openai = new OpenAI({ baseURL: process.env.DEEPSEEK_API_BASE_URL!, apiKey: process.env.DEEPSEEK_API_KEY! });

@Controller('api/copilotkit')
export class MastraController {
  constructor(private readonly mastraService: MastraService) {}

  @Post()
  @Public()
  async chat(@Body() req: Request, @Res() res: Response) {
    const serviceAdapter = new OpenAIAdapter({
      openai,
    } as any);
    const runtime = new CopilotRuntime();
    const handler = copilotRuntimeNestEndpoint({
      runtime,
      serviceAdapter,
      endpoint: '/copilotkit',
    });
    return handler(req, res);
  }
}
