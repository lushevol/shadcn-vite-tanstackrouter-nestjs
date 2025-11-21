import { Body, Controller, Post, Res, UseFilters } from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { OpenAIExceptionFilter } from '../common/filters/openai-exception.filter';
import type { CreateChatCompletionDto } from './dto/chat-completion.dto';
import type { OpenAIService } from './openai.service';

@Controller('v1/chat')
@UseFilters(OpenAIExceptionFilter)
export class OpenAIController {
  constructor(private readonly openAiService: OpenAIService) {}

  @Post('completions')
  async chatCompletions(@Body() body: CreateChatCompletionDto, @Res() res: Response) {
    const result = await this.openAiService.handleRequest(body);

    if (result instanceof Observable) {
      // STREAMING RESPONSE (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      result.subscribe({
        next: (data) => {
          if (data === '[DONE]') res.write('data: [DONE]\n\n');
          else res.write(`data: ${JSON.stringify(data)}\n\n`);
        },
        error: (err) => { console.error(err); res.end(); },
        complete: () => res.end(),
      });
    } else {
      // STANDARD JSON RESPONSE
      res.json(result);
    }
  }
}
