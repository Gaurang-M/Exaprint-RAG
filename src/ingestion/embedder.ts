import { OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../config/env.js';

let _embeddings: OpenAIEmbeddings | null = null;

export function getEmbeddings(): OpenAIEmbeddings {
  if (!_embeddings) {
    _embeddings = new OpenAIEmbeddings({
      openAIApiKey: env.OPENAI_API_KEY,
      modelName: env.OPENAI_EMBEDDING_MODEL,
      batchSize: 512,
      stripNewLines: true,
    });
  }
  return _embeddings;
}
