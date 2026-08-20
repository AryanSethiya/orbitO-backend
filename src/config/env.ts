import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // AI & Embeddings
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),
  GEMINI_CHAT_MODEL: z.string().default('gemini-2.0-flash'),

  // Game Rules
  TIMEZONE: z.string().default('Asia/Kolkata'),
  VOCABULARY_VERSION: z.string().default('v1'),
  DEFAULT_STARTING_SCORE: z.coerce.number().default(1000),
  GUESS_PENALTY: z.coerce.number().default(5),
  HINT_1_PENALTY: z.coerce.number().default(100),
  HINT_2_PENALTY: z.coerce.number().default(200),
  HINT_3_PENALTY: z.coerce.number().default(350),
});

export type Env = z.infer<typeof envSchema>;

export const validateEnv = (): Env => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment configuration');
  }
  return result.data;
};

export const env = validateEnv();
