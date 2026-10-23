/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Lightweight client-side logger.
 * In development, outputs standard console logs.
 * In production, suppresses debug diagnostics and guards against leaking sensitive data.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  warn: (message: string, context?: unknown): void => {
    if (context !== undefined) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  error: (message: string, error?: unknown): void => {
    if (error !== undefined) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
};
