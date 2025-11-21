export class TextUtils {
  static applyStopSequences(content: string, stop?: string | string[]): string {
    if (!stop) return content;
    const sequences = Array.isArray(stop) ? stop : [stop];
    
    let cutoffIndex = content.length;
    for (const seq of sequences) {
      const index = content.indexOf(seq);
      if (index !== -1 && index < cutoffIndex) {
        cutoffIndex = index;
      }
    }
    return content.substring(0, cutoffIndex);
  }

  static estimateTokens(text: string): number {
    // specific estimation: ~4 chars per token
    return Math.ceil(text.length / 4);
  }
}
