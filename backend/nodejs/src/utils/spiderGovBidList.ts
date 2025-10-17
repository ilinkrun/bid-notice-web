/**
 * Government Bid Notice List Spider - TypeScript Implementation
 * Converted from Python spider_list.py
 * Uses jnu-web, jnu-doc, and mysql2
 */

import { reqGet, reqPost, PlaywrightChromeBasic } from 'jnu-web';
import { Xpath } from 'jnu-doc';
import { Mysql } from 'jnu-db';

// Error codes
const ERROR_CODES = {
  SUCCESS: 0,
  SETTINGS_NOT_FOUND: 100,
  PAGE_ACCESS_ERROR: 200,
  IFRAME_ERROR: 210,
  SELECTOR_ERROR: 220,
  ROW_PARSING_ERROR: 300,
  NEXT_PAGE_ERROR: 400,
  DATA_PROCESSING_ERROR: 500,
  TITLE_ERROR: 301,
  URL_ERROR: 302,
  DATE_ERROR: 303,
  UNKNOWN_ERROR: 900,
  SELENIUM_ERROR: 999
} as const;

// Constants
const TABLE_NOTICES = 'notice_list';
const TABLE_DETAILS = 'notice_details';
const TABLE_FILES = 'notice_files';
const TABLE_CATEGORY_SETTINGS = 'settings_notice_category';
const DONE_NOTICE_KEYWORDS = ['결과'];
const MAX_RETRY = 20;

// Cache for valid categories
let validCategoriesCache: string[] | null = null;

// MySQL Connection using jnu-db
let mysqlInstance: Mysql | null = null;

function createMySQLPool(config?: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}) {
  if (!mysqlInstance) {
    const dbConfig = config || {
      host: '1.231.118.217',
      port: 20201,
      user: 'root',
      password: 'mysqlIlmac123',
      database: 'ubuntu_ilmac__ilmac_bid_web_db'
    };

    mysqlInstance = new Mysql(dbConfig);
  }
  return mysqlInstance;
}

// Types
interface ScrapingSettings {
  oid?: number;
  org_name: string;
  url: string;
  iframe?: string;
  rowXpath: string;
  paging?: string;
  startPage: number;
  endPage: number;
  login?: string;
  org_region?: string;
  registration?: string;
  use?: number;
  company_in_charge?: string;
  org_man?: string;
  exception_row?: string;
  elements: string;
}

interface NoticeItem {
  title: string;
  detail_url: string;
  posted_date: string;
  posted_by?: string;
  org_name: string;
  scraped_at: string;
  error_code?: number | null;
  error_message?: string | null;
  category?: string;
  is_selected?: number;
  sn?: number;
  exception_row?: boolean;
}

interface ScrapeResult {
  org_name: string;
  error_code: number;
  error_message: string;
  data: NoticeItem[];
}

// Utility Functions
function getNow(format?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  if (format === '%Y-%m-%d') {
    return `${year}-${month}-${day}`;
  } else if (format === '%Y%m%d_%H%M%S') {
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }
  // Default format: YYYY-MM-DD HH:mm:ss
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getFormatDate(dateStr: string): string {
  try {
    // Clean up the string first - remove excessive whitespace and newlines
    dateStr = dateStr.replace(/\s+/g, ' ').trim();

    // Empty or too short
    if (!dateStr || dateStr.length < 5) {
      return getNow('%Y-%m-%d');
    }

    // Range dates (use first date)
    if (dateStr.includes('~')) {
      dateStr = dateStr.split('~')[0].trim();
    }

    // Extract date pattern (YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD or YYYYMMDD)
    const datePattern = /(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})/;
    const match = dateStr.match(datePattern);

    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else {
      // No valid date found
      return getNow('%Y-%m-%d');
    }

    // Validate date
    const parsedDate = new Date(dateStr);
    const today = new Date(getNow('%Y-%m-%d'));

    if (isNaN(parsedDate.getTime())) {
      return getNow('%Y-%m-%d');
    }

    // Don't allow future dates
    if (parsedDate > today) {
      return getNow('%Y-%m-%d');
    }

    // Don't allow dates before 2000
    const year2000 = new Date('2000-01-01');
    if (parsedDate < year2000) {
      return getNow('%Y-%m-%d');
    }

    return dateStr;
  } catch (e) {
    return getNow('%Y-%m-%d');
  }
}

function validStr(str: any, maxLength?: number): string {
  if (typeof str !== 'string') return '';
  let result = str.trim().replace(/\s+/g, ' ');
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  return result;
}

// MySQL Helper Functions
async function findLastNotice(orgName: string, field: string = 'title'): Promise<[number, any]> {
  const db = createMySQLPool();
  const result = await db.find<any[]>(TABLE_NOTICES, {
    where: { org_name: orgName },
    fields: ['sn'],
    orderBy: 'sn DESC',
    limit: 1
  });

  if (result.success && result.data && result.data.length > 0) {
    return [result.data[0].sn as number, null];
  }
  return [0, null];
}

async function findSettingsNoticeListByOrgName(orgName: string): Promise<ScrapingSettings | null> {
  const db = createMySQLPool();
  const result = await db.findOne<any>('settings_notice_list', {
    where: { org_name: orgName, use: 1 },
    limit: 1
  });

  if (!result.success || !result.data) return null;

  const row = result.data;

  // Build elements string from individual fields
  const elementParts: string[] = [];
  if (row.title) elementParts.push(`title=${row.title}`);
  if (row.detail_url) elementParts.push(`detail_url=${row.detail_url}`);
  if (row.posted_date) elementParts.push(`posted_date=${row.posted_date}`);
  if (row.posted_by) elementParts.push(`posted_by=${row.posted_by}`);
  if (row.exception_row) elementParts.push(`exception_row=${row.exception_row}`);

  const settings = {
    ...row,
    elements: elementParts.join(',')
  } as ScrapingSettings;

  return settings;
}

async function findOrgNames(): Promise<string[]> {
  const db = createMySQLPool();
  const result = await db.find<any[]>('settings_notice_list', {
    where: { use: 1 },
    fields: ['org_name']
  });

  if (!result.success || !result.data) return [];

  return result.data.map(row => row.org_name as string);
}

async function getStartEndPage(orgName: string): Promise<[number, number]> {
  const settings = await findSettingsNoticeListByOrgName(orgName);
  if (settings) {
    return [settings.startPage, settings.endPage];
  }
  return [1, 3];
}

// Data insertion
async function insertListData(csvData: any[][]): Promise<Array<{ org_name: string; inserted_count: number }>> {
  if (csvData.length < 2) {
    console.log('!!!No posts available.');
    return [];
  }

  const db = createMySQLPool();
  const headers = csvData[0];
  const orgNameIdx = headers.indexOf('org_name');
  const detailUrlIdx = headers.indexOf('detail_url');

  if (orgNameIdx === -1 || detailUrlIdx === -1) {
    throw new Error('Required columns not found');
  }

  // Group by org_name
  const orgData: { [key: string]: any[][] } = {};
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    const orgName = row[orgNameIdx];
    if (!orgData[orgName]) {
      orgData[orgName] = [];
    }
    orgData[orgName].push(row);
  }

  const orgInsertCounts: { [key: string]: number } = {};

  // Process each organization
  for (const [orgName, rows] of Object.entries(orgData)) {
    orgInsertCounts[orgName] = 0;

    const [lastSn] = await findLastNotice(orgName);
    let currentSn = lastSn;

    const limit = Math.max(100, csvData.length);
    const urlsResult = await db.find<any[]>(TABLE_NOTICES, {
      where: { org_name: orgName },
      fields: ['detail_url'],
      orderBy: 'sn DESC',
      limit: limit
    });

    const existingUrlSet = new Set(
      urlsResult.success && urlsResult.data ? urlsResult.data.map((row: any) => row.detail_url) : []
    );
    const processedUrls = new Set<string>();

    const dataToInsert: any[] = [];

    for (const row of rows) {
      const url = row[detailUrlIdx];
      if (!existingUrlSet.has(url) && !processedUrls.has(url)) {
        currentSn++;
        const rowWithSn = [...row, currentSn];
        dataToInsert.push(rowWithSn);
        orgInsertCounts[orgName]++;
        processedUrls.add(url);
      }
    }

    // Insert data
    if (dataToInsert.length > 0) {
      const insertHeaders = [...headers, 'sn'];

      // Remove error fields
      const fieldsToRemove = ['error_code', 'error_message'];
      const finalHeaders = insertHeaders.filter(h => !fieldsToRemove.includes(h));

      const fieldIndices = finalHeaders.map(h => insertHeaders.indexOf(h));
      const finalData = dataToInsert.map(row =>
        fieldIndices.map(idx => row[idx])
      );

      // Build insert query
      const placeholders = finalData.map(() =>
        `(${finalHeaders.map(() => '?').join(', ')})`
      ).join(', ');

      const values = finalData.flat();

      const insertQuery = `
        INSERT INTO ${TABLE_NOTICES} (${finalHeaders.join(', ')})
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE
        ${finalHeaders.filter(h => h !== 'detail_url').map(h => `${h} = VALUES(${h})`).join(', ')}
      `;

      await db.executeQuery(insertQuery, values);
    }
  }

  return Object.entries(orgInsertCounts).map(([org_name, inserted_count]) => ({
    org_name,
    inserted_count
  }));
}

// Scraping with Playwright (for browser-based scraping)
async function scrapeListWithPlaywright(
  orgName: string,
  startPage: number,
  endPage: number,
  url: string,
  rowXpath: string,
  paging: string,
  elements: string
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    org_name: orgName,
    error_code: ERROR_CODES.SUCCESS,
    error_message: '',
    data: []
  };

  try {
    const browser = new PlaywrightChromeBasic();

    // Use CHROMIUM_EXECUTABLE_PATH from environment variable
    const initOptions: any = {
      headless: true,
      arguments: []
    };

    if (process.env.CHROMIUM_EXECUTABLE_PATH) {
      initOptions.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
      console.log(`[PlaywrightChromeBasic] Using CHROMIUM_EXECUTABLE_PATH: ${process.env.CHROMIUM_EXECUTABLE_PATH}`);
    }

    await browser.initialize(initOptions);

    const allData: NoticeItem[] = [];
    const page = (browser as any).page;

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      try {
        let targetUrl = url;
        if (url.includes('${i}')) {
          targetUrl = url.replace('${i}', String(pageNum));
        }

        await browser.goto(targetUrl);

        // Wait for table rows to load
        // Convert XPath to Playwright selector format
        const playwrightSelector = `xpath=${rowXpath}`;
        try {
          await page.waitForSelector(playwrightSelector, { timeout: 30000 });
        } catch (e) {
          console.log(`Selector ${rowXpath} not found on page ${pageNum}`);
        }

        await page.waitForTimeout(3000);

        // Use Playwright locators directly instead of HTML parsing
        const pageData = await parseRowsFromPage(page, rowXpath, elements, orgName);
        allData.push(...pageData);

        // Navigate to next page if paging exists
        if (paging && paging.includes('${i}') && pageNum < endPage) {
          const nextPageNum = pageNum + 1;
          const nextPageSelector = paging.replace('${i}', String(nextPageNum));

          try {
            const elementExists = await page.$(nextPageSelector);
            if (elementExists) {
              await page.click(nextPageSelector);
              await page.waitForTimeout(2000);
            } else {
              break;
            }
          } catch (e) {
            break;
          }
        }
      } catch (e) {
        console.error(`Error processing page ${pageNum}:`, e);
        continue;
      }
    }

    await browser.close();
    result.data = allData;
  } catch (e) {
    result.error_code = ERROR_CODES.SELENIUM_ERROR;
    result.error_message = `Playwright error: ${e}`;
  }

  return result;
}

// Parse rows directly from Playwright page
async function parseRowsFromPage(
  page: any,
  rowXpath: string,
  elements: string,
  orgName: string
): Promise<NoticeItem[]> {
  const rows: NoticeItem[] = [];

  try {
    console.log(`[parseRowsFromPage] Starting to parse rows for ${orgName}`);
    console.log(`[parseRowsFromPage] rowXpath: ${rowXpath}`);
    console.log(`[parseRowsFromPage] elements: ${elements}`);

    const playwrightSelector = `xpath=${rowXpath}`;
    const rowLocators = await page.locator(playwrightSelector).all();
    console.log(`[parseRowsFromPage] Found ${rowLocators.length} rows`);

    const elementMappings = parseElements(elements);
    console.log(`[parseRowsFromPage] Element mappings:`, elementMappings);

    for (let rowIdx = 0; rowIdx < rowLocators.length; rowIdx++) {
      const rowLocator = rowLocators[rowIdx];
      const row: Partial<NoticeItem> = {
        org_name: orgName,
        scraped_at: getNow()
      };

      console.log(`[parseRowsFromPage] Processing row ${rowIdx + 1}/${rowLocators.length}`);

      for (const [key, xpathExpr] of Object.entries(elementMappings)) {
        try {
          let value: string = '';

          // Check if expression contains |- separator (field extraction configuration)
          if (xpathExpr.includes('|-')) {
            const parts = xpathExpr.split('|-');
            const elementPath = parts[0].trim();
            const target = parts[1]?.trim() || 'text';
            const callback = parts[2]?.trim() || '';

            console.log(`[parseRowsFromPage] Row ${rowIdx + 1} - ${key} parts:`, { elementPath, target, callback });

            // Get the element using XPath with shorter timeout
            const element = rowLocator.locator(`xpath=${elementPath}`);

            // Extract value based on target type
            if (target === 'text') {
              value = await element.textContent({ timeout: 3000 }) || '';
            } else if (target === 'href' || target.startsWith('@')) {
              // Extract attribute (href or other attributes like @data-id)
              const attrName = target.startsWith('@') ? target.substring(1) : target;
              const attrValue = await element.getAttribute(attrName, { timeout: 3000 });

              console.log(`[parseRowsFromPage] Row ${rowIdx + 1} - ${key} attrValue: ${attrValue}`);

              // Apply callback template if exists
              if (callback && attrValue) {
                try {
                  // Define rst variable for use in the callback expression
                  const rst = attrValue;
                  // Eval the callback as-is (no quote removal) - safe here as it's our own template
                  value = eval(callback);
                  console.log(`[parseRowsFromPage] Row ${rowIdx + 1} - ${key} callback eval result: ${value}`);
                } catch (evalErr) {
                  console.error(`[parseRowsFromPage] Row ${rowIdx + 1} - Failed to eval callback "${callback}":`, evalErr);
                  // Fallback: if callback is simple text replacement pattern, try simple replacement
                  if (callback.includes('rst') && !callback.includes('+') && !callback.includes('.split(')) {
                    value = callback.replace(/["']/g, '').replace('rst', attrValue).trim();
                  } else {
                    value = attrValue || '';
                  }
                }
              } else {
                value = attrValue || '';
              }
            } else if (target === 'html') {
              value = await element.innerHTML({ timeout: 3000 }) || '';
            }

            console.log(`[parseRowsFromPage] Row ${rowIdx + 1} - ${key} final value: ${value}`);
          } else {
            // Simple XPath without configuration - assume it's a CSS selector or simple XPath
            const element = rowLocator.locator(`xpath=${xpathExpr}`);
            value = await element.textContent({ timeout: 3000 }) || '';
            console.log(`[parseRowsFromPage] Row ${rowIdx + 1} - ${key} value: ${value}`);
          }

          if (key === 'posted_date') {
            row[key] = getFormatDate(value || '');
          } else if (key === 'title') {
            row.title = validStr(value, 500); // Limit title length
          } else if (key === 'detail_url') {
            row.detail_url = validStr(value, 500); // Limit URL length
          } else if (key === 'posted_by') {
            row.posted_by = validStr(value, 100); // Limit posted_by length
          }
        } catch (e) {
          console.error(`[parseRowsFromPage] Row ${rowIdx + 1} - Error extracting ${key}:`, e);
          if (key === 'posted_date') {
            row[key] = getNow('%Y-%m-%d');
          }
        }
      }

      // Only add if we have required fields
      if (row.title && row.detail_url) {
        console.log(`[parseRowsFromPage] Row ${rowIdx + 1} - Added to results:`, { title: row.title, detail_url: row.detail_url });
        rows.push(row as NoticeItem);
      } else {
        console.log(`[parseRowsFromPage] Row ${rowIdx + 1} - Skipped (missing required fields):`, { title: row.title, detail_url: row.detail_url });
      }
    }

    console.log(`[parseRowsFromPage] Total rows collected: ${rows.length}`);
  } catch (e) {
    console.error('[parseRowsFromPage] Error parsing rows from page:', e);
  }

  return rows;
}

// Parse rows from HTML using Xpath (from jnu-doc)
function parseRowsFromHtml(
  html: string,
  rowXpath: string,
  elements: string,
  orgName: string
): NoticeItem[] {
  const xpathParser = new Xpath(html);
  const rows: NoticeItem[] = [];

  try {
    // Find all row elements using Xpath.find() method
    const rowElements = xpathParser.find(rowXpath);
    const elementMappings = parseElements(elements);

    // Use xpath library for relative path queries from row elements
    const xpathLib = require('xpath');

    for (let rowIdx = 0; rowIdx < rowElements.length; rowIdx++) {
      const rowEl = rowElements[rowIdx];

      const row: Partial<NoticeItem> = {
        org_name: orgName,
        scraped_at: getNow()
      };

      for (const [key, xpathExpr] of Object.entries(elementMappings)) {
        try {
          let value: string = '';

          if (key === 'detail_url' && xpathExpr.includes('|-')) {
            // Special handling for detail_url with format: "td[2]/a|-href|-\"url\" + rst"
            const parts = xpathExpr.split('|-');
            const elementPath = parts[0].trim();
            const attribute = parts[1]?.trim() || '';
            const urlTemplate = parts[2]?.trim() || '';

            // Use relative XPath from the row element
            const relativeXpath = `./${elementPath}`;
            const result = xpathLib.select(relativeXpath, rowEl);

            if (Array.isArray(result) && result.length > 0) {
              const targetEl = result[0] as Element;
              let attrValue = '';

              if (attribute.startsWith('@')) {
                // Attribute specified with @, extract directly
                attrValue = targetEl.getAttribute(attribute.substring(1)) || '';
              } else if (attribute) {
                // Attribute specified without @
                attrValue = targetEl.getAttribute(attribute) || '';
              } else {
                // No attribute, get href by default for links
                attrValue = targetEl.getAttribute('href') || '';
              }

              // Replace template
              if (urlTemplate && attrValue) {
                value = urlTemplate.replace(/["']/g, '').replace('rst', attrValue).trim();
              } else if (attrValue) {
                value = attrValue;
              }
            }
          } else {
            // Normal xpath value extraction using relative path
            const relativeXpath = `./${xpathExpr}`;
            const result = xpathLib.select(relativeXpath, rowEl);

            if (Array.isArray(result) && result.length > 0) {
              const node = result[0] as Node;
              value = node.textContent?.trim() || '';
            }
          }

          if (key === 'posted_date') {
            row[key] = getFormatDate(value || '');
          } else if (key === 'title') {
            row.title = validStr(value, 500);
          } else if (key === 'detail_url') {
            row.detail_url = validStr(value, 500);
          } else if (key === 'posted_by') {
            row.posted_by = validStr(value, 100);
          }
        } catch (e) {
          if (key === 'posted_date') {
            row[key] = getNow('%Y-%m-%d');
          }
        }
      }

      // Validate required fields
      if (!row.title) {
        row.error_code = ERROR_CODES.TITLE_ERROR;
        row.error_message = 'No title';
      }
      if (!row.detail_url) {
        row.error_code = ERROR_CODES.URL_ERROR;
        row.error_message = 'No detail URL';
      }

      // Only add if no critical errors
      if (row.title && row.detail_url) {
        rows.push(row as NoticeItem);
      }
    }
  } catch (e) {
    console.error('Error parsing rows:', e);
  }

  return rows;
}

// Parse elements string to mapping
function parseElements(elements: string): { [key: string]: string } {
  const mapping: { [key: string]: string } = {};

  // Format: "title=xpath1,detail_url=xpath2,posted_date=xpath3,..."
  const pairs = elements.split(',');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      mapping[key.trim()] = value.trim();
    }
  }

  return mapping;
}

// Main scraping function using requests (reqGet/reqPost from jnu-web)
async function scrapeListBySettings(
  settings: ScrapingSettings,
  debug: boolean = false
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    org_name: settings.org_name,
    error_code: ERROR_CODES.SUCCESS,
    error_message: '',
    data: []
  };

  // Validate required settings
  if (!settings.org_name || !settings.url || !settings.rowXpath) {
    result.error_code = ERROR_CODES.SETTINGS_NOT_FOUND;
    result.error_message = 'Required settings missing';
    return result;
  }

  try {
    const allData: NoticeItem[] = [];

    // Process pages concurrently
    const pagePromises: Promise<NoticeItem[]>[] = [];

    for (let pageNum = settings.startPage; pageNum <= settings.endPage; pageNum++) {
      pagePromises.push(processPage(settings, pageNum, debug));
    }

    const pageResults = await Promise.all(pagePromises);

    for (const pageData of pageResults) {
      allData.push(...pageData);
    }

    // If no data or too little data, retry with Playwright
    if (allData.length < 2) {
      console.log(`Retrying with Playwright for ${settings.org_name}`);
      const playwrightResult = await scrapeListWithPlaywright(
        settings.org_name,
        settings.startPage,
        settings.endPage,
        settings.url,
        settings.rowXpath,
        settings.paging || '',
        settings.elements
      );
      allData.push(...playwrightResult.data);
    }

    if (allData.length > 0) {
      allData.reverse(); // Latest first
      const filteredData = allData.filter(item => item.title);
      result.data = filteredData;
    }
  } catch (e) {
    result.error_code = ERROR_CODES.UNKNOWN_ERROR;
    result.error_message = `Scraping error: ${e}`;
  }

  return result;
}

async function processPage(
  settings: ScrapingSettings,
  pageNum: number,
  debug: boolean
): Promise<NoticeItem[]> {
  try {
    let pageUrl = settings.url;
    if (settings.url.includes('${i}')) {
      pageUrl = settings.url.replace('${i}', String(pageNum));
    }

    // Use reqGet from jnu-web
    const response = await reqGet(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response || !response.data) {
      return [];
    }

    const html = response.data;
    const pageData = parseRowsFromHtml(html, settings.rowXpath, settings.elements, settings.org_name);

    return pageData;
  } catch (e) {
    console.error(`Error processing page ${pageNum}:`, e);
    return [];
  }
}

// Scrape list by org name
async function scrapeList(
  orgName: string,
  startPage?: number,
  endPage?: number,
  debug: boolean = false
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    org_name: orgName,
    error_code: ERROR_CODES.SUCCESS,
    error_message: '',
    data: []
  };

  const settings = await findSettingsNoticeListByOrgName(orgName);
  if (!settings) {
    result.error_code = ERROR_CODES.SETTINGS_NOT_FOUND;
    result.error_message = `Settings not found for ${orgName}`;
    return result;
  }

  // Override page range if provided
  if (startPage && startPage > 0) {
    settings.startPage = startPage;
  }
  if (endPage && endPage > 0 && endPage >= settings.startPage) {
    settings.endPage = endPage;
  }

  return scrapeListBySettings(settings, debug);
}

// Category classification functions
function isDoneNotice(title: string): boolean {
  if (!title) return false;

  for (const keyword of DONE_NOTICE_KEYWORDS) {
    if (title.includes(keyword)) {
      return true;
    }
  }

  return false;
}

interface CategorySettings {
  sn: number;
  keywords: string;
  nots: string;
  min_point: number;
  category: string;
}

async function findAllCategorySettings(): Promise<CategorySettings[]> {
  const db = createMySQLPool();
  const result = await db.find<any[]>(TABLE_CATEGORY_SETTINGS, {
    where: { use: 1 },
    fields: ['sn', 'keywords', 'nots', 'min_point', 'category'],
    orderBy: 'priority ASC, sn ASC'
  });

  if (!result.success || !result.data) return [];

  return result.data as CategorySettings[];
}

async function getValidCategories(): Promise<string[]> {
  // Return cached categories if available
  if (validCategoriesCache) {
    return validCategoriesCache;
  }

  // Load categories from DB
  const db = createMySQLPool();
  const result = await db.executeQuery<any[]>(
    `SELECT DISTINCT category FROM ${TABLE_CATEGORY_SETTINGS} WHERE \`use\` = 1`
  );

  if (!result.success || !result.data) return [];

  validCategoriesCache = result.data.map((row: any) => row.category);
  return validCategoriesCache;
}

function matchesCategoryCriteria(title: string, keywords: string, nots: string, minPoint: number): boolean {
  // Check exclusion words first
  if (nots) {
    const notWords = nots.split(',').map(w => w.trim()).filter(w => w);
    for (const notWord of notWords) {
      if (title.includes(notWord)) {
        return false;
      }
    }
  }

  // Calculate keyword score
  if (!keywords) {
    return false;
  }

  let totalScore = 0;
  const keywordItems = keywords.split(',').map(item => item.trim()).filter(item => item);

  for (const item of keywordItems) {
    if (item.includes('*')) {
      const parts = item.split('*');
      if (parts.length === 2) {
        const keyword = parts[0].trim();
        const weight = parseInt(parts[1].trim(), 10);
        if (!isNaN(weight) && title.includes(keyword)) {
          totalScore += weight;
        }
      }
    } else {
      // No weight, default 1 point
      if (title.includes(item)) {
        totalScore += 1;
      }
    }
  }

  return totalScore >= minPoint;
}

async function classifyNoticesByCategory(notices: NoticeItem[]): Promise<NoticeItem[]> {
  if (!notices || notices.length === 0) {
    return [];
  }

  // Get all category settings
  const categorySettings = await findAllCategorySettings();

  // Initialize all notices with '무관' category
  for (const notice of notices) {
    notice.category = '무관';
  }

  // Match each category in priority order
  for (const setting of categorySettings) {
    for (const notice of notices) {
      // Only classify if still '무관'
      if (notice.category === '무관') {
        const title = notice.title || '';
        if (title && matchesCategoryCriteria(title, setting.keywords, setting.nots, setting.min_point)) {
          notice.category = setting.category;
        }
      }
    }
  }

  return notices;
}

async function filterValidCategoryNotices(notices: NoticeItem[]): Promise<NoticeItem[]> {
  const validCategories = await getValidCategories();
  const validCategoriesSet = new Set(validCategories);
  return notices.filter(notice => validCategoriesSet.has(notice.category || ''));
}

// Filter new notices
async function filterNewNotices(scrapedData: NoticeItem[], orgName: string): Promise<NoticeItem[]> {
  if (!scrapedData || scrapedData.length === 0) {
    return [];
  }

  const db = createMySQLPool();
  const limit = Math.max(100, scrapedData.length);

  const result = await db.find<any[]>(TABLE_NOTICES, {
    where: { org_name: orgName },
    fields: ['detail_url'],
    orderBy: 'sn DESC',
    limit: limit
  });

  const existingUrlSet = new Set(
    result.success && result.data ? result.data.map((row: any) => row.detail_url) : []
  );
  const processedUrls = new Set<string>();

  const newNotices: NoticeItem[] = [];

  for (const notice of scrapedData) {
    const url = notice.detail_url;
    if (url && !existingUrlSet.has(url) && !processedUrls.has(url)) {
      newNotices.push(notice);
      processedUrls.add(url);
    }
  }

  return newNotices;
}

// Process single agency (new workflow)
async function processSingleAgency(orgName: string, debug: boolean = false): Promise<{
  success: boolean;
  error_code: number;
  error_message: string;
  scraped_count: number;
  new_count: number;
  inserted_count: number;
  log: any;
}> {
  const result = {
    success: false,
    error_code: ERROR_CODES.SUCCESS,
    error_message: '',
    scraped_count: 0,
    new_count: 0,
    inserted_count: 0,
    log: null
  };

  try {
    // 1. Scrape board
    const [startPage, endPage] = await getStartEndPage(orgName);
    const scrapeResult = await scrapeList(orgName, startPage, endPage, debug);

    if (scrapeResult.error_code !== ERROR_CODES.SUCCESS) {
      result.error_code = scrapeResult.error_code;
      result.error_message = scrapeResult.error_message;
      result.log = {
        org_name: orgName,
        error: {
          error_code: result.error_code,
          error_message: result.error_message
        },
        scraped_count: 0,
        new_count: 0,
        inserted_count: 0,
        time: getNow()
      };
      return result;
    }

    const scrapedData = scrapeResult.data;
    result.scraped_count = scrapedData.length;

    if (scrapedData.length < 2) {
      result.success = false;
      result.error_code = scrapeResult.error_code !== 0 ? scrapeResult.error_code : ERROR_CODES.DATA_PROCESSING_ERROR;
      result.error_message = scrapeResult.error_message || 'Insufficient scraped data';
      result.log = {
        org_name: orgName,
        error: {
          error_code: result.error_code,
          error_message: result.error_message
        },
        scraped_count: result.scraped_count,
        new_count: 0,
        inserted_count: 0,
        time: getNow()
      };
      return result;
    }

    // 2. Filter new notices
    const newNotices = await filterNewNotices(scrapedData, orgName);
    result.new_count = newNotices.length;

    if (newNotices.length === 0) {
      result.success = true;
      result.log = {
        org_name: orgName,
        error: null,
        scraped_count: result.scraped_count,
        new_count: 0,
        inserted_count: 0,
        time: getNow()
      };
      return result;
    }

    // 3. Classify notices by category
    const classifiedNotices = await classifyNoticesByCategory(newNotices);

    // 4. Filter only valid category notices (exclude '무관')
    const validNotices = await filterValidCategoryNotices(classifiedNotices);

    // 5. Mark done notices
    for (const notice of validNotices) {
      if (isDoneNotice(notice.title)) {
        notice.is_selected = 9;
      }
    }

    // If no valid notices after filtering, return success but with 0 inserted
    if (validNotices.length === 0) {
      result.success = true;
      result.log = {
        org_name: orgName,
        error: null,
        scraped_count: result.scraped_count,
        new_count: result.new_count,
        inserted_count: 0,
        time: getNow()
      };
      return result;
    }

    // 6. Insert data
    if (validNotices.length > 0) {
      const headers = ['title', 'posted_date', 'posted_by', 'detail_url', 'org_name', 'scraped_at', 'is_selected', 'category'];
      const csvData = [headers];

      for (const notice of validNotices) {
        csvData.push([
          notice.title,
          notice.posted_date,
          notice.posted_by || '',
          notice.detail_url,
          notice.org_name,
          notice.scraped_at,
          String(notice.is_selected || 0),
          notice.category || '무관'
        ]);
      }

      const insertedData = await insertListData(csvData);

      for (const inserted of insertedData) {
        if (inserted.org_name === orgName) {
          result.inserted_count = inserted.inserted_count;
          break;
        }
      }
    }

    result.success = true;
    result.log = {
      org_name: orgName,
      error: null,
      scraped_count: result.scraped_count,
      new_count: result.new_count,
      inserted_count: result.inserted_count,
      time: getNow()
    };
  } catch (e) {
    result.error_code = ERROR_CODES.UNKNOWN_ERROR;
    result.error_message = `Error processing agency ${orgName}: ${e}`;
    result.log = {
      org_name: orgName,
      error: {
        error_code: result.error_code,
        error_message: result.error_message
      },
      scraped_count: result.scraped_count,
      new_count: result.new_count,
      inserted_count: result.inserted_count,
      time: getNow()
    };
  }

  return result;
}

// Batch process agencies
async function fetchListPages(names: string[], save: boolean = true): Promise<any> {
  console.log(`@@@ Scrape Notices At: ${getNow()}`);
  console.log('='.repeat(100));

  const allLogs: any[] = [];
  const errorOrgs: string[] = [];

  // Process in batches of 2
  for (let i = 0; i < names.length; i += 2) {
    const batchNames = names.slice(i, i + 2);

    for (const orgName of batchNames) {
      const result = await processSingleAgency(orgName);

      if (result.log) {
        allLogs.push(result.log);
      }

      if (!result.success) {
        errorOrgs.push(orgName);
      }

      console.log(`${orgName}: Scraped=${result.scraped_count}, New=${result.new_count}, Inserted=${result.inserted_count}`);
    }
  }

  console.log(`Total agencies: ${names.length}, Errors: ${errorOrgs.length}`);

  return {
    logs: allLogs,
    error_orgs: errorOrgs
  };
}

// Exports
export {
  ERROR_CODES,
  createMySQLPool,
  getNow,
  getFormatDate,
  validStr,
  findLastNotice,
  findSettingsNoticeListByOrgName,
  findOrgNames,
  getStartEndPage,
  insertListData,
  scrapeListWithPlaywright,
  parseRowsFromPage,
  parseRowsFromHtml,
  scrapeListBySettings,
  scrapeList,
  isDoneNotice,
  findAllCategorySettings,
  getValidCategories,
  classifyNoticesByCategory,
  filterValidCategoryNotices,
  filterNewNotices,
  processSingleAgency,
  fetchListPages
};

export type {
  ScrapingSettings,
  NoticeItem,
  ScrapeResult
};

export default {
  scrapeList,
  scrapeListBySettings,
  processSingleAgency,
  fetchListPages,
  filterNewNotices,
  createMySQLPool,
  ERROR_CODES
};
