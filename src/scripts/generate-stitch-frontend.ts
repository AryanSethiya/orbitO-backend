import fs from 'fs';
import path from 'path';

const root = '/Users/aryan.sethiya/Desktop/orbitO frontend';

// src/api/client.ts with exact backend route paths
const apiClientCode = `import type { SessionSummary, GuessResult, HintResult, AIRoast, LeaderboardResponse } from '../types/game';

const RAW_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
const BASE_URL = RAW_URL.replace(/\\/api\\/v1\\/?$/, '').replace(/\\/$/, '');

export class ApiClient {
  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const cleanPath = endpoint.startsWith('/') ? endpoint : \`/\${endpoint}\`;
    const targetUrl = \`\${BASE_URL}/api/v1\${cleanPath}\`;

    const res = await fetch(targetUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let errorMsg = 'HTTP Error ' + res.status;
      try {
        const errorData = await res.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    return res.json();
  }

  static async startSession(userId?: string): Promise<SessionSummary> {
    const payload = userId && userId.length === 36 ? { userId } : {};
    return this.request<SessionSummary>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async submitGuess(sessionId: string, guess: string): Promise<GuessResult> {
    return this.request<GuessResult>(\`/sessions/\${sessionId}/guess\`, {
      method: 'POST',
      body: JSON.stringify({ guess: guess.trim().toLowerCase() }),
    });
  }

  static async requestHint(sessionId: string): Promise<HintResult> {
    return this.request<HintResult>(\`/sessions/\${sessionId}/hints\`, {
      method: 'POST',
    });
  }

  static async generateRoast(sessionId: string, style: 'friendly' | 'savage' | 'hype' | 'balanced' = 'savage'): Promise<AIRoast> {
    return this.request<AIRoast>(\`/sessions/\${sessionId}/roast\`, {
      method: 'POST',
      body: JSON.stringify({ style }),
    });
  }

  static async getDailyLeaderboard(): Promise<LeaderboardResponse> {
    return this.request<LeaderboardResponse>('/leaderboard/daily');
  }
}
`;

fs.writeFileSync(path.join(root, 'src/api/client.ts'), apiClientCode.trim());
console.log('✅ Synchronized exact backend Fastify route paths in ApiClient!');
