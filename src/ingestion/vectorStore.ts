import { Chroma } from '@langchain/community/vectorstores/chroma';
import { ChromaClient } from 'chromadb';
import type { Document } from '@langchain/core/documents';
import { getEmbeddings } from './embedder.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface ChromaConfig {
  collectionName?: string;
  url?: string;
}

/** Open an existing Chroma collection for querying. Throws if not yet created. */
export async function getVectorStore(config: ChromaConfig = {}): Promise<Chroma> {
  return Chroma.fromExistingCollection(getEmbeddings(), {
    collectionName: config.collectionName ?? env.CHROMA_COLLECTION_NAME,
    url: config.url ?? env.CHROMA_URL,
  });
}

/** Delete a collection entirely. Safe to call if collection does not exist. */
export async function deleteCollection(config: ChromaConfig = {}): Promise<void> {
  const name = config.collectionName ?? env.CHROMA_COLLECTION_NAME;
  const client = new ChromaClient({ path: config.url ?? env.CHROMA_URL });
  try {
    await client.deleteCollection({ name });
    logger.info(`Deleted collection "${name}"`);
  } catch {
    logger.debug(`Collection "${name}" did not exist, skipping delete`);
  }
}

const UPSERT_BATCH_SIZE = 100;

/** Add documents to a collection in batches, creating it if it does not exist. */
export async function upsertDocuments(
  docs: Document[],
  config: ChromaConfig = {}
): Promise<void> {
  const collectionName = config.collectionName ?? env.CHROMA_COLLECTION_NAME;
  const url = config.url ?? env.CHROMA_URL;

  // Split into batches to avoid ChromaDB payload size limits
  const batches: Document[][] = [];
  for (let i = 0; i < docs.length; i += UPSERT_BATCH_SIZE) {
    batches.push(docs.slice(i, i + UPSERT_BATCH_SIZE));
  }

  // First batch creates the collection; subsequent batches add to it
  const firstBatch = batches[0];
  if (!firstBatch) return;

  const store = await Chroma.fromDocuments(firstBatch, getEmbeddings(), { collectionName, url });
  logger.info(`Upserted batch 1/${batches.length} (${firstBatch.length} chunks)`);

  for (let i = 1; i < batches.length; i++) {
    await store.addDocuments(batches[i]!);
    logger.info(`Upserted batch ${i + 1}/${batches.length} (${batches[i]!.length} chunks)`);
  }

  logger.info(`Done — ${docs.length} chunks stored in collection "${collectionName}"`);
}
