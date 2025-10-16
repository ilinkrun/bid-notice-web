// Common types for scraping functionality

export interface ScrapingSettings {
  oid: number;
  org_name: string;
  url: string;
  iframe?: string;
  rowXpath: string;
  paging?: string;
  startPage: number;
  endPage: number;
  login?: string;
  org_region?: string;
  registration?: number;
  use: number;
  company_in_charge?: string;
  org_man?: string;
  exception_row?: string;
  elements: string; // JSON string containing xpath mappings
}

export interface ScrapedNotice {
  title: string;
  detail_url: string;
  posted_date: string;
  posted_by?: string;
  org_name: string;
  scraped_at: string;
  category?: string;
  error_code?: number;
  budget_amount?: string;
  deadline?: string;
  contact?: string;
}

export interface ScrapingResult {
  org_name: string;
  error_code: number;
  error_message: string;
  data: ScrapedNotice[];
}

export interface WorkflowResult {
  success: boolean;
  error_code: number;
  error_message: string;
  scraped_count: number;
  new_count: number;
  inserted_count: number;
  log?: ScrapingLog;
}

export interface ScrapingLog {
  org_name: string;
  error: { error_code: number; error_message: string } | null;
  scraped_count: number;
  new_count: number;
  inserted_count: number;
  time: string;
}

export interface CategorySettings {
  category: string;
  keywords: string;
  nots?: string;
  min_point: number;
}

export const ERROR_CODES = {
  SUCCESS: 0,
  SETTINGS_NOT_FOUND: 100,
  SCRAPING_FAILED: 200,
  DATABASE_ERROR: 300,
  NETWORK_ERROR: 400,
  UNKNOWN_ERROR: 900
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];