import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { logger } from '../../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('[Error]', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  const status = (err as { status?: number }).status ?? 500;
  res.status(status).json({ error: message });
};
