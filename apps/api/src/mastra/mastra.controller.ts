import { Body, Controller, Post, Res } from '@nestjs/common';
import { MastraService } from './mastra.service';

@Controller('api/copilotkit')
export class MastraController {
  constructor(private readonly mastraService: MastraService) {

  }
  
  @Post()
  async chat(@Body() body: any, @Res() res: Response) {
    
    // 1. Initialize Copilot Runtime
    const runtime = new CopilotRuntime();

    // 2. Handle the request
    // We adapt the Mastra agent to work with CopilotKit's expected stream.
    // Since Mastra is the "Brain", we can treat it like a custom model handler
    // or simply use CopilotKit's own service adapter if we want to bypass Mastra for simple chat.
    
    // However, to use MASTRA as the core:
    // We extract the latest message, send it to Mastra, and stream the result back.
    
    const userMessage = body.messages[body.messages.length - 1].content;
    
    try {
      // Call Mastra Agent
      const mastraResponse = await this.mastraService.generate(userMessage);
      
      // Stream the text back to the frontend compatible with CopilotKit
      // (Simplified streaming response for demonstration)
      res.setHeader('Content-Type', 'application/json');
      res.json({
        result: mastraResponse.text // Or mastraResponse.content
      });
      
    } catch (error) {
      console.error("Agent Error:", error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
}
