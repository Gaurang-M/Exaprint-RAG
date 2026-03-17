#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { runIngestionPipeline } from '../ingestion/pipeline.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const program = new Command();

program
  .name('ingest')
  .description('Scrape and ingest web pages into ChromaDB for RAG')
  .version('1.0.0')
  .argument('[urls...]', 'One or more URLs to ingest')
  .option('-f, --file <path>', 'Path to a text file with one URL per line (# lines are ignored)')
  .option('-c, --collection <name>', 'ChromaDB collection name', env.CHROMA_COLLECTION_NAME)
  .option('-d, --depth <number>', 'Max crawl depth (0 = single page only)', '0')
  .option('-e, --exclude <dirs...>', 'URL paths to skip during crawling (e.g. /login /account)')
  .option('-t, --timeout <ms>', 'Request timeout per page in ms', '10000')
  .option('--clear', 'Delete the collection before ingesting (fresh start)')
  .action(async (urlArgs: string[], options: { file?: string; collection: string; depth: string; exclude?: string[]; timeout: string; clear?: boolean }) => {
    let urls: string[] = [...urlArgs];

    if (options.file) {
      const fileContents = readFileSync(options.file, 'utf-8');
      const fileUrls = fileContents
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));
      urls = [...urls, ...fileUrls];
    }

    if (urls.length === 0) {
      logger.error('Error: Provide at least one URL as an argument or via --file');
      process.exit(1);
    }

    const depth = parseInt(options.depth, 10);

    logger.info(`Ingesting ${urls.length} URL(s) into collection "${options.collection}"`);
    logger.info(`Crawl depth: ${depth} (${depth === 0 ? 'single page' : `up to ${depth} level(s) deep`})`);
    if (options.exclude?.length) {
      logger.info(`Excluding paths: ${options.exclude.join(' ')}`);
    }

    try {
      await runIngestionPipeline({
        urls,
        collectionName: options.collection,
        loaderOptions: {
          maxDepth: depth,
          excludeDirs: options.exclude ?? [],
          timeout: parseInt(options.timeout, 10),
        },
        clear: options.clear,
      });
    } catch (err) {
      logger.error('Ingestion failed:', err);
      process.exit(1);
    }
  });

program.parse();
