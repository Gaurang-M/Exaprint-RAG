import { RecursiveUrlLoader } from '@langchain/community/document_loaders/web/recursive_url';
import { compile } from 'html-to-text';
import type { Document } from '@langchain/core/documents';
import { logger } from '../utils/logger.js';

export interface LoaderOptions {
  /** 0 = single page, N = crawl up to N levels deep */
  maxDepth?: number;
  /** Directories/paths to skip during crawling */
  excludeDirs?: string[];
  /** Request timeout in ms (default: 10000) */
  timeout?: number;
}

export async function loadUrl(
  url: string,
  options: LoaderOptions = {}
): Promise<Document[]> {
  const extractor = compile({ wordwrap: false });

  const loader = new RecursiveUrlLoader(url, {
    extractor,
    maxDepth: options.maxDepth ?? 0,
    excludeDirs: options.excludeDirs ?? [],
    timeout: options.timeout ?? 10000,
    preventOutside: true,
  });

  return loader.load();
}

export async function loadUrls(
  urls: string[],
  options: LoaderOptions = {}
): Promise<Document[]> {
  const results = await Promise.allSettled(urls.map((url) => loadUrl(url, options)));
  const docs: Document[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result && result.status === 'fulfilled') {
      docs.push(...result.value);
    } else if (result && result.status === 'rejected') {
      logger.warn(`Failed to load URL ${urls[i]}: ${(result.reason as Error).message}`);
    }
  }

  return docs;
}
