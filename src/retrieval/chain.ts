import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import type { Document } from '@langchain/core/documents';
import { createRetriever } from './retriever.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const RAG_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a knowledgeable assistant for Exaprint, a professional printing company.
Answer questions directly and naturally, as if you work at Exaprint and know the products well.
Use only the information in the context below — never invent details not present there.
Do NOT start your answer with phrases like "Based on the context", "According to the information provided", "The context mentions", or any similar preamble. Just answer directly.
If the context truly does not contain enough information, say "I don't have that information right now" naturally.

Context:
{context}`,
  ],
  ['human', '{question}'],
]);

function formatDocs(docs: Document[]): string {
  return docs
    .map(
      (doc, i) =>
        `[${i + 1}] Source: ${(doc.metadata as Record<string, unknown>)['source'] ?? 'unknown'}\n${doc.pageContent}`
    )
    .join('\n\n---\n\n');
}

export interface RAGResult {
  answer: string;
  sources: string[];
}

export async function queryRAG(question: string, k?: number): Promise<RAGResult> {
  const retriever = await createRetriever(k);

  const llm = new ChatAnthropic({
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    modelName: env.ANTHROPIC_MODEL,
    temperature: 0,
    maxTokens: 1024,
  });

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocs),
      question: new RunnablePassthrough(),
    },
    RAG_PROMPT,
    llm,
    new StringOutputParser(),
  ]);

  logger.info(`RAG query: "${question}"`);

  // Run retriever separately to extract source URLs for the response
  const relevantDocs = await retriever.invoke(question);
  const sources = [
    ...new Set(
      relevantDocs
        .map((d) => (d.metadata as Record<string, unknown>)['source'] as string | undefined)
        .filter((s): s is string => Boolean(s))
    ),
  ];
  logger.info(`Retrieved ${relevantDocs.length} chunk(s): ${sources.join(' | ') || 'none'}`);

  const answer = await chain.invoke(question);
  logger.info(`Answer generated (${answer.length} chars)`);

  return { answer, sources };
}
