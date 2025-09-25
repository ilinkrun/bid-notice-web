// Common utilities for scraping functionality

/**
 * Convert XPath to CSS selector (basic conversion)
 */
export function xpathToSelector(xpath: string): string {
  // Handle common XPath patterns
  let selector = xpath;

  // Remove xpath prefix variations
  selector = selector.replace(/^\.?\/\/?/, '');

  // Convert basic patterns
  selector = selector.replace(/\/\//g, ' ');
  selector = selector.replace(/\//g, ' > ');
  selector = selector.replace(/\[@([^=]+)='([^']+)'\]/g, '[$1="$2"]');
  selector = selector.replace(/\[@([^=]+)="([^"]+)"\]/g, '[$1="$2"]');
  selector = selector.replace(/\[(\d+)\]/g, ':nth-child($1)');

  // Clean up extra spaces
  selector = selector.replace(/\s+/g, ' ').trim();

  return selector;
}

/**
 * Clean text content from HTML elements
 */
export function cleanText(text: string): string {
  if (!text) return '';

  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n|\r|\t/g, ' ') // Replace newlines and tabs
    .trim();
}

/**
 * Format date string to YYYY-MM-DD format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';

  // Remove extra whitespace
  dateStr = dateStr.trim();

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Handle YYYY.MM.DD format
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\./g, '-');
  }

  // Handle MM/DD/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [month, day, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }

  // Handle Korean date formats like "2024년 09월 26일"
  if (/\d{4}년\s*\d{1,2}월\s*\d{1,2}일/.test(dateStr)) {
    const matches = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (matches) {
      const [, year, month, day] = matches;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Try to parse with Date
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    // Ignore parsing errors
  }

  // Return original if no pattern matches
  return dateStr;
}

/**
 * Get current timestamp in YYYY-MM-DD HH:mm:ss format
 */
export function getCurrentTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Create a simple logger
 */
export function createLogger(name: string) {
  return {
    info: (message: string) => console.log(`[${name}] INFO: ${message}`),
    debug: (message: string) => console.log(`[${name}] DEBUG: ${message}`),
    error: (message: string) => console.error(`[${name}] ERROR: ${message}`),
    warn: (message: string) => console.warn(`[${name}] WARN: ${message}`)
  };
}

/**
 * Make absolute URL from relative URL
 */
export function makeAbsoluteUrl(relativeUrl: string, baseUrl: string): string {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http')) return relativeUrl;

  try {
    const base = new URL(baseUrl);
    return new URL(relativeUrl, base.origin).href;
  } catch (error) {
    return relativeUrl;
  }
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}