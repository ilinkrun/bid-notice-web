// Common type definitions for the entire backend system

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

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
  elements: string;
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
  error_message?: string;
  sn?: number;
}

export interface NoticeDetail {
  nid: number;
  title: string;
  body_html?: string;
  file_name?: string;
  file_url?: string;
  org_name: string;
  created_at: string;
  updated_at?: string;
}

export interface CategorySettings {
  sn: number;
  keywords: string;
  nots: string;
  min_point: number;
  category: string;
  creator?: string;
  memo?: string;
  use?: number;
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
  error?: {
    error_code: number;
    error_message: string;
  } | null;
  scraped_count: number;
  new_count?: number;
  inserted_count: number;
  time: string;
}

export const ERROR_CODES = {
  SUCCESS: 0,
  SETTINGS_NOT_FOUND: 100,
  PAGE_ACCESS_ERROR: 200,
  IFRAME_ERROR: 210,
  SELECTOR_ERROR: 220,
  ROW_PARSING_ERROR: 300,
  TITLE_ERROR: 301,
  URL_ERROR: 302,
  DATE_ERROR: 303,
  NEXT_PAGE_ERROR: 400,
  DATA_PROCESSING_ERROR: 500,
  UNKNOWN_ERROR: 900,
  PLAYWRIGHT_ERROR: 999
} as const;

export const VALID_CATEGORIES = ["공사점검", "성능평가", "기타"] as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
export type ValidCategory = typeof VALID_CATEGORIES[number];

// GraphQL types
export interface GraphQLContext {
  dataSources?: any;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}