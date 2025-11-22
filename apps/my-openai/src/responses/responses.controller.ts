import { Body, Controller, Logger, Post, Res, UseFilters } from '@nestjs/common';
import { Response } from 'express';
import { ResponseCreateParams } from 'openai/resources/responses/responses';
import { Observable } from 'rxjs';
import { OpenAIExceptionFilter } from '../common/filters/openai-exception.filter';
import { ResponsesService } from './responses.service';

@Controller('v1')
@UseFilters(OpenAIExceptionFilter)
export class ResponsesController {
  private readonly logger = new Logger(ResponsesController.name);

  constructor(private readonly responsesService: ResponsesService) {}

  @Post('responses')
  async chatCompletions(@Body() body: ResponseCreateParams, @Res() res: Response) {
    // Log entry with a short preview of the body to avoid logging huge payloads
    try {
      const preview = JSON.stringify(body ?? {}).slice(0, 500);
      this.logger.log(`responses#create called. body preview: ${preview}`);
    } catch {
      this.logger.debug('Failed to stringify request body preview');
    }

    const result = await this.responsesService.handleRequest(body);

    if (result instanceof Observable) {
      // STREAMING RESPONSE (SSE)
      this.logger.log('Streaming response (SSE) started for responses#create');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      result.subscribe({
        next: (data) => {
          if (data === '[DONE]') {
            this.logger.debug('Streaming marker [DONE] received');
            res.write('data: [DONE]\n\n');
          } else {
            // Debug log chunk data (keep concise)
            try {
              const chunkPreview = JSON.stringify(data).slice(0, 500);
              this.logger.debug(`Streaming chunk: ${chunkPreview}`);
            } catch {
              this.logger.debug('Streaming chunk received (unserializable)');
            }
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          }
        },
        error: (err) => {
          this.logger.error('Error while streaming responses#create', (err && err.stack) || err);
          res.end();
        },
        complete: () => {
          this.logger.log('Streaming response complete for responses#create');
          res.end();
        },
      });
    } else {
      // STANDARD JSON RESPONSE
      this.logger.log('Returning standard JSON response for responses#create');
      res.json(result);
    }
  }
}
