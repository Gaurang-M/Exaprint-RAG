import { z } from 'zod';
import 'dotenv/config';
import { logger } from '../utils/logger.js';

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  CHROMA_URL: z.string().url().default('http://localhost:8000'),
  CHROMA_COLLECTION_NAME: z.string().default('exaprint_docs'),
  ANTHROPIC_MODEL: z.string().default('claude-haiku-4-5-20251001'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  RETRIEVER_K: z.coerce.number().int().min(1).max(20).default(5),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error('Invalid environment variables:');
  for (const [key, messages] of Object.entries(parsed.error.flatten().fieldErrors)) {
    logger.error(`  ${key}: ${messages?.join(', ')}`);
  }
  process.exit(1);
}

export const env: Env = parsed.data;
