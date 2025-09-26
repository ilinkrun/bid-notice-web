/**
 * Government notice collector - Based on Python spider_list_new.py structure
 * Handles web scraping from Korean government agency websites
 */

import { Browser, chromium, Page } from 'playwright';
import { createLogger, cleanText, formatDate, makeAbsoluteUrl } from '@/utils/scraping-utils';

const logger = createLogger('gov-collector');

// Error codes (matching Python implementation)
const ERROR_CODES = {
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

export interface ScrapingSettings {
  oid: number;
  org_name: string;
  url: string;
  rowXpath: string;
  startPage: number;
  endPage: number;
  use: number;
  elements: string; // JSON string of element selectors
  iframe?: string;
  paging?: string;
  login?: string;
  org_region?: string;
  registration?: string;
  exception_row?: string;
}

export interface ScrapingResult {
  org_name: string;
  error_code: number;
  error_message: string;
  data: NoticeItem[];
}

export interface NoticeItem {
  title: string;
  detail_url: string;
  posted_date: string;
  posted_by: string;
  org_name: string;
  scraped_at: string;
}

export interface GovCollectionOptions {
  limit?: number;
  dryRun?: boolean;
  debug?: boolean;
  agencies?: string[];
}

export interface GovCollectionResult {
  success: boolean;
  totalScraped: number;
  totalInserted: number;
  agencies: number;
  errors: string[];
}

/**
 * Main function to collect government notices
 */
export async function collectGovNotices(options: GovCollectionOptions = {}): Promise<GovCollectionResult> {
  const {
    limit = 10,
    dryRun = false,
    debug = false,
    agencies = []
  } = options;

  logger.info(`Starting GOV notice collection with limit: ${limit}, dryRun: ${dryRun}`);

  try {
    // Get agencies to process
    const agenciesToProcess = agencies.length > 0 ? agencies : await getDefaultAgencies();

    if (agenciesToProcess.length === 0) {
      logger.warn('No agencies configured for scraping');
      return {
        success: true,
        totalScraped: 0,
        totalInserted: 0,
        agencies: 0,
        errors: []
      };
    }

    const limitedAgencies = agenciesToProcess.slice(0, Math.max(1, Math.floor(limit / 10)));
    logger.info(`Processing ${limitedAgencies.length} agencies: ${limitedAgencies.join(', ')}`);

    if (dryRun) {
      logger.info('DRY RUN MODE: No data will be saved to database');
      return {
        success: true,
        totalScraped: limitedAgencies.length * 5, // Mock scraped count
        totalInserted: 0,
        agencies: limitedAgencies.length,
        errors: []
      };
    }

    // Process each agency
    let totalScraped = 0;
    let totalInserted = 0;
    const errors: string[] = [];

    for (const agencyName of limitedAgencies) {
      try {
        const result = await collectGovAgencyNotices(agencyName, { debug, dryRun });
        totalScraped += result.scraped;
        totalInserted += result.inserted;

        if (result.error) {
          errors.push(`${agencyName}: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${agencyName}: ${errorMessage}`);
        logger.error(`Error processing agency ${agencyName}: ${errorMessage}`);
      }
    }

    return {
      success: errors.length === 0,
      totalScraped,
      totalInserted,
      agencies: limitedAgencies.length,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`GOV collection failed: ${errorMessage}`);

    return {
      success: false,
      totalScraped: 0,
      totalInserted: 0,
      agencies: 0,
      errors: [errorMessage]
    };
  }
}

/**
 * Collect notices from a specific government agency
 */
export async function collectGovAgencyNotices(
  agencyName: string,
  options: { debug?: boolean; dryRun?: boolean } = {}
): Promise<{
  success: boolean;
  scraped: number;
  inserted: number;
  error?: string;
}> {
  const { debug = false, dryRun = false } = options;

  logger.info(`Collecting notices from agency: ${agencyName}`);

  try {
    // Get scraping settings for this agency
    const settings = await getScrapingSettings(agencyName);

    if (!settings) {
      return {
        success: false,
        scraped: 0,
        inserted: 0,
        error: `No scraping settings found for agency: ${agencyName}`
      };
    }

    // Perform scraping
    const result = await scrapeListBySettings(settings, debug);

    if (result.error_code !== ERROR_CODES.SUCCESS) {
      return {
        success: false,
        scraped: 0,
        inserted: 0,
        error: result.error_message
      };
    }

    let insertedCount = 0;
    if (!dryRun && result.data.length > 0) {
      // TODO: Implement database insertion
      insertedCount = result.data.length;
      logger.info(`TODO: Insert ${result.data.length} notices to database`);
    }

    return {
      success: true,
      scraped: result.data.length,
      inserted: insertedCount,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Agency collection failed: ${errorMessage}`);

    return {
      success: false,
      scraped: 0,
      inserted: 0,
      error: errorMessage
    };
  }
}

/**
 * Scrape notices using settings (similar to Python's scrape_list_by_settings)
 */
export async function scrapeListBySettings(settings: ScrapingSettings, debug: boolean = false): Promise<ScrapingResult> {
  const result: ScrapingResult = {
    org_name: settings.org_name,
    error_code: ERROR_CODES.SUCCESS,
    error_message: '',
    data: []
  };

  // Validate required settings
  if (!settings.org_name || !settings.url || !settings.rowXpath) {
    const error = `Required settings missing. org_name: ${settings.org_name}, url: ${settings.url}, rowXpath: ${settings.rowXpath}`;
    result.error_code = ERROR_CODES.SETTINGS_NOT_FOUND;
    result.error_message = error;
    return result;
  }

  // Parse elements JSON
  let elements: Record<string, { xpath: string }>;
  try {
    elements = JSON.parse(settings.elements);
  } catch (error) {
    result.error_code = ERROR_CODES.DATA_PROCESSING_ERROR;
    result.error_message = `Failed to parse elements JSON: ${error}`;
    return result;
  }

  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    if (debug) {
      logger.debug(`Scraping ${settings.org_name} from ${settings.url}`);
      logger.debug(`Pages: ${settings.startPage} to ${settings.endPage}`);
      logger.debug(`Row XPath: ${settings.rowXpath}`);
    }

    // Scrape pages
    for (let pageNum = settings.startPage; pageNum <= settings.endPage; pageNum++) {
      try {
        const pageData = await scrapePage(page, settings, elements, pageNum, debug);
        result.data.push(...pageData);
      } catch (pageError) {
        const errorMessage = pageError instanceof Error ? pageError.message : String(pageError);
        logger.error(`Error scraping page ${pageNum}: ${errorMessage}`);

        if (result.data.length === 0) {
          result.error_code = ERROR_CODES.PAGE_ACCESS_ERROR;
          result.error_message = `Failed to scrape any pages: ${errorMessage}`;
        }
      }
    }

    logger.info(`Scraped ${result.data.length} notices from ${settings.org_name}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.error_code = ERROR_CODES.PLAYWRIGHT_ERROR;
    result.error_message = errorMessage;
    logger.error(`Playwright error for ${settings.org_name}: ${errorMessage}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return result;
}

/**
 * Scrape a single page
 */
async function scrapePage(
  page: Page,
  settings: ScrapingSettings,
  elements: Record<string, { xpath: string; target?: string; callback?: string }>,
  pageNum: number,
  debug: boolean
): Promise<NoticeItem[]> {
  const notices: NoticeItem[] = [];

  // Navigate to page
  const url = settings.url.includes('pageNum') ?
    settings.url.replace('pageNum', pageNum.toString()) :
    settings.url;

  await page.goto(url, { waitUntil: 'networkidle' });

  // Handle iframe if specified
  if (settings.iframe) {
    const frameHandle = await page.waitForSelector(settings.iframe);
    const frame = await frameHandle?.contentFrame();
    if (frame) {
      (page as any) = frame; // Use frame instead of page
    }
  }

  // Get all rows using XPath
  const rowXpath = settings.rowXpath.startsWith('xpath=') ? settings.rowXpath : `xpath=${settings.rowXpath}`;
  const rows = await page.locator(rowXpath).all();

  if (debug) {
    logger.debug(`Found ${rows.length} rows on page ${pageNum}`);
  }

  for (const row of rows) {
    try {
      const notice: Partial<NoticeItem> = {
        org_name: settings.org_name,
        scraped_at: new Date().toISOString()
      };

      // Extract data based on elements configuration
      for (const [field, selector] of Object.entries(elements)) {
        try {
          // Use XPath directly since database stores XPath selectors
          const xpathSelector = selector.xpath.startsWith('xpath=') ? selector.xpath : `xpath=${selector.xpath}`;
          const element = row.locator(xpathSelector).first();
          let value = '';

          // Determine what to extract based on target
          const target = selector.target || (field === 'detail_url' ? 'href' : 'text');

          if (target === 'text') {
            value = cleanText(await element.textContent() || '');
          } else {
            // Extract attribute value
            value = await element.getAttribute(target) || '';
          }

          // Apply callback transformation if specified
          if (value && selector.callback) {
            try {
              // Simple callback evaluation - in production, this should be more secure
              // Replace 'rst' with the extracted value
              const transformedValue = selector.callback.replace(/rst/g, JSON.stringify(value));

              // Evaluate simple expressions like "URL" + rst
              if (transformedValue.includes('"') && transformedValue.includes('+')) {
                const evaluated = eval(transformedValue);
                if (typeof evaluated === 'string') {
                  value = evaluated;
                }
              }
            } catch (callbackError) {
              if (debug) {
                logger.debug(`Callback evaluation failed for ${field}: ${callbackError}`);
              }
            }
          }

          // For detail_url, make absolute URL if needed
          if (field === 'detail_url' && value && !value.startsWith('http')) {
            value = makeAbsoluteUrl(value, settings.url);
          }

          if (field === 'title') notice.title = value;
          else if (field === 'detail_url') notice.detail_url = value;
          else if (field === 'posted_date') notice.posted_date = formatDate(value);
          else if (field === 'posted_by') notice.posted_by = value;

          if (debug && value) {
            logger.debug(`Extracted ${field}: '${value}'`);
          } else if (debug && !value) {
            logger.debug(`Empty value for ${field} with XPath '${selector.xpath}'`);
          }

        } catch (fieldError) {
          if (debug) {
            logger.debug(`Failed to extract ${field} with XPath '${selector.xpath}': ${fieldError}`);
          }
        }
      }

      // Validate required fields - for now, only require title
      if (debug) {
        logger.debug(`Notice validation: title='${notice.title}', detail_url='${notice.detail_url}'`);
      }

      if (notice.title) {
        // Set a placeholder URL if detail_url is missing
        if (!notice.detail_url) {
          notice.detail_url = settings.url; // Use base URL as fallback
        }
        notices.push(notice as NoticeItem);
        if (debug) {
          logger.debug(`Added notice: ${notice.title}`);
        }
      } else if (debug) {
        logger.debug(`Skipped notice due to missing title`);
      }

    } catch (rowError) {
      if (debug) {
        logger.debug(`Failed to parse row: ${rowError}`);
      }
    }
  }

  return notices;
}

/**
 * Get scraping settings for an agency from database
 */
export async function getScrapingSettings(agencyName: string): Promise<ScrapingSettings | null> {
  const { executeQuery } = await import('@/utils/mysql');

  try {
    // Get basic configuration fields
    const configQuery = `
      SELECT oid, org_name, url, iframe, rowXpath, paging, startPage, endPage,
             login, org_region, registration, \`use\`, company_in_charge, org_man, exception_row
      FROM settings_notice_list
      WHERE org_name = ? AND \`use\` = 1
    `;

    const configResults = await executeQuery(configQuery, [agencyName]) as any[];

    if (configResults.length === 0) {
      logger.warn(`No scraping settings found for agency: ${agencyName}`);
      return null;
    }

    const config = configResults[0];

    // Get element fields (title, detail_url, posted_date, posted_by)
    const elementQuery = `
      SELECT title, detail_url, posted_date, posted_by
      FROM settings_notice_list
      WHERE org_name = ?
    `;

    const elementResults = await executeQuery(elementQuery, [agencyName]) as any[];

    if (elementResults.length === 0) {
      logger.warn(`No element settings found for agency: ${agencyName}`);
      return null;
    }

    const elements = elementResults[0];

    // Convert elements to JSON format similar to Python implementation
    const elementsConfig: Record<string, { xpath: string; target?: string; callback?: string }> = {};

    // Parse elements using Python-like separator logic
    for (const [key, value] of Object.entries(elements)) {
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Handle Python's SEPARATOR format: xpath|-target|-callback
        const parts = value.split('|-');
        const xpath = parts[0].trim();

        if (xpath) {
          const elementConfig: { xpath: string; target?: string; callback?: string } = { xpath };

          // Parse target (attribute to extract)
          if (parts.length > 1 && parts[1].trim()) {
            elementConfig.target = parts[1].trim();
          }

          // Parse callback (transformation function)
          if (parts.length > 2 && parts[2].trim()) {
            elementConfig.callback = parts[2].trim();
          }

          elementsConfig[key] = elementConfig;
        }
      }
    }

    const settings: ScrapingSettings = {
      oid: config.oid,
      org_name: config.org_name,
      url: config.url,
      rowXpath: config.rowXpath,
      startPage: config.startPage,
      endPage: config.endPage,
      use: config.use,
      elements: JSON.stringify(elementsConfig),
      iframe: config.iframe || undefined,
      paging: config.paging || undefined,
      login: config.login || undefined,
      org_region: config.org_region || undefined,
      registration: config.registration || undefined,
      exception_row: config.exception_row || undefined
    };

    logger.debug(`Loaded settings for ${agencyName}: url=${settings.url}, rowXpath=${settings.rowXpath}, pages=${settings.startPage}-${settings.endPage}, elementsCount=${Object.keys(elementsConfig).length}`);

    return settings;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to load settings for ${agencyName}: ${errorMessage}`);
    return null;
  }
}

/**
 * Get default agencies list from database
 */
async function getDefaultAgencies(): Promise<string[]> {
  const { executeQuery } = await import('@/utils/mysql');

  try {
    const query = `
      SELECT org_name
      FROM settings_notice_list
      WHERE \`use\` = 1
      ORDER BY org_name
    `;

    const results = await executeQuery(query) as Array<{ org_name: string }>;
    const agencies = results.map(row => row.org_name);

    logger.info(`Found ${agencies.length} active agencies in database`);

    return agencies;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to load agencies from database: ${errorMessage}`);

    // Fallback to hardcoded list if database query fails
    logger.warn('Using fallback agency list');
    return [
      '가평군청',
      '한국공항공사',
    ];
  }
}