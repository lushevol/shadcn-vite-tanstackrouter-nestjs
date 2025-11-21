import { Injectable } from '@nestjs/common';
import { mastra } from 'mastra-app';
import type { GenerateTextResult } from '@mastra/core';

@Injectable()
export class MastraService {
  public async chat(message: string): Promise<GenerateTextResult<any, undefined>> {
    const agent = mastra.getAgent('weatherAgent');
    return agent.generateLegacy(message);
  }
}

