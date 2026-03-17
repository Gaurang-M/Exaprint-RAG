type Level = 'info' | 'warn' | 'error' | 'debug';

function format(level: Level, ...args: unknown[]): void {
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase().padEnd(5)}]`;
  if (level === 'error') console.error(prefix, ...args);
  else if (level === 'warn') console.warn(prefix, ...args);
  else console.log(prefix, ...args);
}

export const logger = {
  info: (...args: unknown[]) => format('info', ...args),
  warn: (...args: unknown[]) => format('warn', ...args),
  error: (...args: unknown[]) => format('error', ...args),
  debug: (...args: unknown[]) => format('debug', ...args),
};
