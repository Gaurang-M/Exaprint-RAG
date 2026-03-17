import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { env } from '../config/env.js';
import { queryRouter } from './routes/query.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { logger } from '../utils/logger.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/query', queryRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info(`RAG API running at http://localhost:${env.PORT}`);
  logger.info(`ChromaDB collection: ${env.CHROMA_COLLECTION_NAME} @ ${env.CHROMA_URL}`);
  logger.info(`LLM: ${env.ANTHROPIC_MODEL} | Embeddings: ${env.OPENAI_EMBEDDING_MODEL}`);
});

export default app;
