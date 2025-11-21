import { Body, Controller, Post, Res } from '@nestjs/common';
import { MastraService } from './mastra.service';
import type { Response } from 'express';

@Controller('api/copilotkit')
export class MastraController {
  constructor(private readonly mastraService: MastraService) {}

  @Post()
  async chat(@Body() body: any, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush headers to establish SSE connection immediately

    const userMessage = body.messages[body.messages.length - 1].content;

    try {
      const mastraResponse = await this.mastraService.chat(userMessage);

      // In a real streaming scenario, mastraService.chat would return an Observable or a ReadableStream
      // and you would pipe it to res.write(). For now, we send the full response as one chunk.
      res.write(`data: ${JSON.stringify({ content: mastraResponse.text })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Agent Error:', error);
      res.status(500).write(`data: ${JSON.stringify({ error: 'Failed to process request' })}\n\n`);
      res.end();
    }
  }
}
