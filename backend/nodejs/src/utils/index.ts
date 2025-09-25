// Common utility functions
import { ApiResponse } from '@/types';

// Date utilities
export function formatDate(dateStr: string): string {
  try {
    if (!dateStr || dateStr.length < 5) {
      return new Date().toISOString().split('T')[0];
    }

    // Handle range dates (take first date)
    if (dateStr.includes('~')) {
      dateStr = dateStr.split('~')[0].trim();
    }

    // Limit length
    if (dateStr.length > 10) {
      dateStr = dateStr.substring(0, 10);
    }

    // Convert dots or slashes to hyphens
    if (dateStr.includes('.') || dateStr.includes('/')) {
      const parts = dateStr.split(/[.\/]/).map(p => p.trim());
      if (parts.length === 3) {
        let [year, month, day] = parts;

        // Add leading zeros
        month = month.padStart(2, '0');
        day = day.padStart(2, '0');

        // Handle 2-digit years
        if (year.length === 2) {
          year = '20' + year;
        }

        dateStr = `${year}-${month}-${day}`;
      }
    }

    // Handle pure number dates (YYYYMMDD)
    if (/^\d{8}$/.test(dateStr)) {
      dateStr = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }

    // Validate the date
    const date = new Date(dateStr);
    const today = new Date();

    if (date > today) {
      return today.toISOString().split('T')[0];
    }

    return dateStr;

  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export function getKSTTimestamp(): string {
  const kst = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
  return kst.replace('T', ' ');
}

// String utilities
export function cleanText(text: string): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

export function extractNumber(text: string): number {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

// URL utilities
export function makeAbsoluteUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// XPath to CSS selector conversion
export function xpathToSelector(xpath: string): string {
  if (!xpath) return '';

  // Remove leading // or /
  xpath = xpath.replace(/^\/+/, '');

  // Convert some basic XPath patterns to CSS selectors
  xpath = xpath.replace(/\[@class=['"]([^'"]+)['"]\]/g, '.$1');
  xpath = xpath.replace(/\[@id=['"]([^'"]+)['"]\]/g, '#$1');
  xpath = xpath.replace(/\//g, ' > ');
  xpath = xpath.replace(/\[(\d+)\]/g, ':nth-child($1)');
  xpath = xpath.replace(/text\(\)/g, '');

  return xpath.trim();
}

// API response helpers
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(code: string, message: string): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message
    },
    timestamp: new Date().toISOString()
  };
}

// Async utilities
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      await sleep(delay * attempt);
    }
  }

  throw lastError!;
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

// Object utilities
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

// Validation utilities
export function isNotEmpty(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Logging utilities
export function createLogger(module: string) {
  const log = (level: string, message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] [${module}] ${message}`, ...args);
  };

  return {
    info: (message: string, ...args: any[]) => log('INFO', message, ...args),
    warn: (message: string, ...args: any[]) => log('WARN', message, ...args),
    error: (message: string, ...args: any[]) => log('ERROR', message, ...args),
    debug: (message: string, ...args: any[]) => {
      if (process.env.NODE_ENV !== 'production') {
        log('DEBUG', message, ...args);
      }
    }
  };
}

// Environment utilities
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

export function getEnvVarAsNumber(name: string, defaultValue?: number): number {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required`);
  }

  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return num;
}

export function getEnvVarAsBoolean(name: string, defaultValue?: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is required`);
  }

  return value.toLowerCase() === 'true';
}