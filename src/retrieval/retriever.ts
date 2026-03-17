import type { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { getVectorStore } from '../ingestion/vectorStore.js';
import { env } from '../config/env.js';

export async function createRetriever(k?: number): Promise<VectorStoreRetriever> {
  const vectorStore = await getVectorStore();
  return vectorStore.asRetriever({
    k: k ?? env.RETRIEVER_K,
    searchType: 'similarity',
  });
}
