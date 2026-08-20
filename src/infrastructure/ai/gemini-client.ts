import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';

export interface RoastPromptData {
  targetWord: string;
  guessesCount: number;
  hintsUsed: number;
  finalScore: number;
  solveTimeSeconds?: number;
  guessesJourney: Array<{ word: string; rank: number }>;
  style?: 'friendly' | 'savage' | 'hype' | 'balanced';
}

export interface IGeminiClient {
  generateHints(targetWord: string): Promise<[string, string, string]>;
  generateRoast(data: RoastPromptData): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}

export class MockGeminiClient implements IGeminiClient {
  async generateEmbedding(text: string): Promise<number[]> {
    return this.generateDeterministicVector(text);
  }

  private generateDeterministicVector(text: string): number[] {
    const vec: number[] = new Array(768).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      vec[i % 768] += Math.sin(code * (i + 1));
    }
    return vec;
  }

  async generateHints(targetWord: string): Promise<[string, string, string]> {
    return [
      `A concept associated with the domain of ${targetWord.length}-letter words.`,
      `Often discussed in everyday life or literature.`,
      `Specifically represents this distinct object or phenomenon.`,
    ];
  }

  async generateRoast(data: RoastPromptData): Promise<string> {
    const firstWord = data.guessesJourney[0]?.word || 'unknown';
    const lastWord = data.guessesJourney[data.guessesJourney.length - 1]?.word || data.targetWord;

    return `You started with "${firstWord}" and wandered across ${data.guessesCount} guesses before stumbling upon "${lastWord}". Hints used: ${data.hintsUsed}. Final score: ${data.finalScore}. Decent orbit!`;
  }
}

export class GoogleGeminiClient implements IGeminiClient {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string = env.GEMINI_API_KEY, modelName: string = env.GEMINI_CHAT_MODEL) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateHints(targetWord: string): Promise<[string, string, string]> {
    const prompt = `You are a word puzzle game master for the game Orbito.
The secret target word is: "${targetWord}".

Generate exactly 3 progressive hints for the players:
- Hint 1: Broad thematic association (does not give much away).
- Hint 2: Situational or contextual clue.
- Hint 3: Specific descriptive clue without saying the exact word.

CRITICAL RULES:
1. You MUST NOT include the word "${targetWord}" or direct variations in any hint.
2. Return ONLY a valid JSON array of 3 strings, e.g. ["hint 1", "hint 2", "hint 3"].
3. Do not include markdown codeblocks or extra text.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();

      // Clean possible markdown json wrapper
      const jsonStr = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (Array.isArray(parsed) && parsed.length >= 3) {
        return [String(parsed[0]), String(parsed[1]), String(parsed[2])];
      }
    } catch (error) {
      console.warn('⚠️ Gemini hint generation fallback triggered:', error);
    }

    // Fallback if parsing fails
    return [
      `Strongly associated with its primary category.`,
      `Often encountered in practical or common scenarios.`,
      `Specifically describes this unique target concept.`,
    ];
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await embeddingModel.embedContent(text);
      if (result?.embedding?.values && result.embedding.values.length > 0) {
        return result.embedding.values;
      }
    } catch (error) {
      console.warn('⚠️ Gemini embedding API error, using fallback:', error);
    }
    return new MockGeminiClient().generateEmbedding(text);
  }

  async generateRoast(data: RoastPromptData): Promise<string> {
    const journeySnippet = data.guessesJourney
      .slice(0, 10)
      .map((g) => `${g.word} (Rank #${g.rank})`)
      .join(' -> ');

    const prompt = `You are an entertaining, witty game host for Orbito, a semantic word puzzle game.
The player just solved the daily puzzle.

Target Word: "${data.targetWord}"
Total Guesses: ${data.guessesCount}
Hints Used: ${data.hintsUsed}
Final Score: ${data.finalScore} / 1000
Player Path: ${journeySnippet}${data.guessesJourney.length > 10 ? ' ... and more' : ''}
Tone Style: ${data.style || 'balanced'} (playful, witty, lightly teasing their bizarre guesses)

Write a short, hilarious 2-3 sentence reaction / roast grounded in their actual guess trajectory. Keep it under 60 words.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const response = await model.generateContent(prompt);
      return response.response.text().trim();
    } catch (error) {
      console.warn('⚠️ Gemini roast generation fallback triggered:', error);
      return new MockGeminiClient().generateRoast(data);
    }
  }
}

export function createGeminiClient(): IGeminiClient {
  if (
    !env.GEMINI_API_KEY ||
    env.GEMINI_API_KEY === 'dummy_key_for_development' ||
    env.NODE_ENV === 'test'
  ) {
    return new MockGeminiClient();
  }
  return new GoogleGeminiClient();
}
