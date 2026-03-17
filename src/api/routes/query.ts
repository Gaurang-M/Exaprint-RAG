import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { queryRAG } from '../../retrieval/chain.js';

export const queryRouter = Router();

const QueryRequestSchema = z.object({
  question: z.string().min(1, 'question is required').max(1000, 'question too long'),
  k: z.number().int().min(1).max(20).optional(),
});

export interface QueryResponse {
  question: string;
  answer: string;
  sources: string[];
}

queryRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const parsed = QueryRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { question, k } = parsed.data;
  try {
    const result = await queryRAG(question, k);
    const response: QueryResponse = { question, answer: result.answer, sources: result.sources };
    res.json(response);
  } catch (err) {
    next(err);
  }
});
