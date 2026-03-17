import type { Document } from '@langchain/core/documents';
import { loadUrls, type LoaderOptions } from '../loaders/webLoader.js';
import { createSplitter } from './splitter.js';
import { upsertDocuments, deleteCollection } from './vectorStore.js';
import { logger } from '../utils/logger.js';

export interface IngestOptions {
  urls: string[];
  loaderOptions?: LoaderOptions;
  collectionName?: string;
  clear?: boolean;
}

export async function runIngestionPipeline(options: IngestOptions): Promise<void> {
  const { urls, loaderOptions, collectionName, clear } = options;

  if (clear) {
    logger.info('[0/3] Clearing existing collection...');
    await deleteCollection({ collectionName });
  }

  logger.info(`[1/3] Loading ${urls.length} URL(s)...`);
  const rawDocs: Document[] = await loadUrls(urls, loaderOptions);
  if (rawDocs.length === 0) {
    logger.warn('No documents loaded. Check the URLs and try again.');
    return;
  }
  logger.info(`      Loaded ${rawDocs.length} document(s)`);

  logger.info('[2/3] Splitting into chunks...');
  const splitter = createSplitter();
  const chunks: Document[] = await splitter.splitDocuments(rawDocs);
  const nonEmptyChunks = chunks.filter((c) => c.pageContent.trim().length > 0);
  logger.info(`      Created ${nonEmptyChunks.length} chunk(s)`);

  logger.info('[3/3] Embedding and storing in ChromaDB...');
  await upsertDocuments(nonEmptyChunks, { collectionName });
  logger.info('Done.');
}
