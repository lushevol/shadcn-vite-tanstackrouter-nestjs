import { Injectable } from '@nestjs/common';
import { BotRequest, BotResponse } from './interfaces/bot.interface';

@Injectable()
export class MyBotService {
  async process(req: BotRequest): Promise<BotResponse> {
    const lastMsg = req.messages[req.messages.length - 1];
    const contentText = Array.isArray(lastMsg.content) 
      ? lastMsg.content.find((c:any) => c.type === 'text')?.text 
      : lastMsg.content;

    // 1. TOOL LOGIC EXAMPLE
    const hasWeatherTool = req.tools?.some((t:any) => t.function.name === 'get_weather');
    if (hasWeatherTool && contentText?.toLowerCase().includes('weather')) {
      return {
        tool_calls: [{
          id: 'call_' + Math.random().toString(36).substr(2, 9),
          type: 'function',
          function: {
            name: 'get_weather',
            arguments: JSON.stringify({ location: 'San Francisco, CA' }),
          },
        }],
      };
    }

    // 2. JSON MODE EXAMPLE
    if (req.isJsonMode) {
      return { content: JSON.stringify({ response: "This is strict JSON", valid: true }) };
    }

    // 3. STANDARD TEXT
    return { 
      content: `[Internal Bot]: I received "${contentText}". I am now simulating a stream.` 
    };
  }
}
