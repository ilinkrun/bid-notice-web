/**
 * Spider for Government Bid Detail Pages
 * Converted from Python spider_detail.py
 * Uses jnu-web, jnu-doc, and jnu-db
 */

import { reqGet, PlaywrightChromeBasic } from 'jnu-web';
import { Mysql } from 'jnu-db';
import { Xpath } from 'jnu-doc';

// Constants
const SEPARATOR = '|-';
const TABLE_NOTICES = 'notice_list';
const TABLE_DETAILS = 'notice_details';
const TABLE_FILES = 'notice_files';
const TABLE_SETTINGS_DETAIL = 'settings_notice_detail';

// Error codes
const ERROR_CODES = {
  SUCCESS: 0,
  SETTINGS_NOT_FOUND: 100,
  PAGE_ACCESS_ERROR: 200,
  PARSING_ERROR: 300,
  UNKNOWN_ERROR: 900
} as const;

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
      database: 'ubuntu_ilmac__ubuntu_project_1_db'
    };

    mysqlInstance = new Mysql(dbConfig);
  }
  return mysqlInstance;
}

// Types
interface DetailSettings {
  org_name: string;
  title?: string;
  body_html?: string;
  file_name?: string;
  file_url?: string;
  notice_div?: string;
  notice_num?: string;
  org_dept?: string;
  org_man?: string;
  org_tel?: string;
  use?: number;
}

interface NoticeDetail {
  nid?: number;
  detail_url: string;
  org_name: string;
  title?: string;
  body_html?: string;
  file_name?: string;
  file_url?: string;
  notice_div?: string;
  notice_num?: string;
  org_dept?: string;
  org_man?: string;
  org_tel?: string;
  posted_date?: string;
  posted_by?: string;
  category?: string;
  created_at?: string;
}

interface ScrapeDetailResult {
  org_name: string;
  error_code: number;
  error_message: string;
  data: Partial<NoticeDetail>;
}

// Utility functions
function validStr(str: any, maxLength?: number): string {
  if (typeof str !== 'string') return '';
  let result = str.trim().replace(/\s+/g, ' ');
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  return result;
}

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
  }

  // Default format: YYYY-MM-DD HH:mm:ss
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Database functions
async function findSettingsNoticeDetailByOrgName(orgName: string): Promise<DetailSettings | null> {
  const db = createMySQLPool();
  const result = await db.findOne<any>(TABLE_SETTINGS_DETAIL, {
    where: { org_name: orgName },
    limit: 1
  });

  if (!result.success || !result.data) return null;

  return result.data as DetailSettings;
}

async function findNoticeByNid(nid: number): Promise<any> {
  const db = createMySQLPool();
  const result = await db.findOne<any>(TABLE_NOTICES, {
    where: { nid: nid },
    fields: ['detail_url', 'org_name', 'created_at', 'posted_date', 'posted_by', 'category']
  });

  if (!result.success || !result.data) return null;

  return result.data;
}

// HTML fetching functions
async function fetchHtmlByRequests(url: string): Promise<string> {
  try {
    // Extract domain for Referer
    let domain = 'https://www.google.com';
    try {
      const urlObj = new URL(url);
      domain = `${urlObj.protocol}//${urlObj.hostname}`;
    } catch (e) {
      // Use default domain
    }

    const response = await reqGet(url, {
      timeout: 30000,
      validateStatus: () => true
    });

    if (!response || response.status !== 200) {
      return '';
    }

    return response.data || '';
  } catch (e) {
    console.error(`Error fetching HTML with requests: ${e}`);
    return '';
  }
}

async function fetchHtmlByPlaywright(
  url: string,
  waitForSelector?: string,
  scroll: boolean = true
): Promise<string> {
  try {
    const browser = new PlaywrightChromeBasic();

    await browser.initialize({
      headless: true,
      arguments: []
    });

    const page = (browser as any).page;

    await browser.goto(url);

    // Wait for specific selector if provided
    if (waitForSelector) {
      try {
        const playwrightSelector = `xpath=${waitForSelector}`;
        await page.waitForSelector(playwrightSelector, { timeout: 30000 });
      } catch (e) {
        console.log(`Selector ${waitForSelector} not found, continuing anyway`);
      }
    }

    await page.waitForTimeout(2000);

    // Scroll if requested
    if (scroll) {
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 300;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });

      await page.evaluate('window.scrollTo(0, 0)');
      await page.waitForTimeout(1000);
    }

    const html = await page.content();
    await browser.close();

    return html;
  } catch (e) {
    console.error(`Error fetching HTML with Playwright: ${e}`);
    return '';
  }
}

// Parse settings elements
function unpackSettingsElements(settings: DetailSettings): Record<string, string> {
  const result: Record<string, string> = {};

  const keys = ['title', 'body_html', 'file_name', 'file_url', 'notice_div', 'notice_num', 'org_dept', 'org_man', 'org_tel'];

  for (const key of keys) {
    if (settings[key as keyof DetailSettings]) {
      result[key] = settings[key as keyof DetailSettings] as string;
    }
  }

  return result;
}

// Extract values from HTML using XPath
// XPath normalization is now handled automatically in the Xpath class
function extractValueByXpath(html: string, xpath: string, attribute?: string): string {
  try {
    const xpathParser = new Xpath(html);

    if (attribute === 'html' || attribute === 'outerhtml') {
      // Get HTML content - use 'innerHTML' attribute
      return xpathParser.value(xpath, 'innerHTML') || '';
    } else if (attribute) {
      // Get attribute value
      return xpathParser.value(xpath, attribute) || '';
    } else {
      // Get text content
      return xpathParser.value(xpath) || '';
    }
  } catch (e) {
    console.error(`Error extracting value by xpath: ${e}`);
    return '';
  }
}

// Extract multiple values (for file lists)
// XPath normalization is now handled automatically in the Xpath class
function extractValuesByXpath(html: string, xpath: string, attribute?: string): string[] {
  try {
    const xpathParser = new Xpath(html);

    if (attribute === 'html' || attribute === 'outerhtml') {
      // Get HTML for multiple elements
      const values = xpathParser.values(xpath, 'innerHTML');
      return values.map((v: any) => String(v).trim()).filter((v: string) => v);
    } else if (attribute) {
      // Get attribute values
      return xpathParser.values(xpath, attribute);
    } else {
      // Get text content
      const values = xpathParser.values(xpath);
      return values.map((v: any) => String(v).trim()).filter((v: string) => v);
    }
  } catch (e) {
    console.error(`Error extracting values by xpath: ${e}`);
    return [];
  }
}

// Parse detail data from HTML
function parseDetailFromHtml(
  html: string,
  settings: Record<string, string>
): Partial<NoticeDetail> {
  const detail: Partial<NoticeDetail> = {};

  for (const [key, xpathConfig] of Object.entries(settings)) {
    if (!xpathConfig) continue;

    // Parse xpath configuration: xpath|-attribute|-callback
    const parts = xpathConfig.split(SEPARATOR);
    const xpath = parts[0]?.trim();
    const attribute = parts[1]?.trim() || undefined;
    // const callback = parts[2]?.trim(); // callback not implemented yet

    if (!xpath) continue;

    try {
      if (key === 'file_name' || key === 'file_url') {
        // Extract multiple values for files
        const values = extractValuesByXpath(html, xpath, attribute);
        detail[key as keyof NoticeDetail] = values.join(SEPARATOR) as any;
      } else {
        // Extract single value
        const value = extractValueByXpath(html, xpath, attribute);
        detail[key as keyof NoticeDetail] = validStr(value) as any;
      }
    } catch (e) {
      console.error(`Error parsing key ${key}: ${e}`);
      detail[key as keyof NoticeDetail] = '' as any;
    }
  }

  return detail;
}

// Main scraping function
async function scrapeDetailBySettings(
  url: string,
  orgName: string,
  settings: DetailSettings,
  debug: boolean = false
): Promise<ScrapeDetailResult> {
  const result: ScrapeDetailResult = {
    org_name: orgName,
    error_code: ERROR_CODES.SUCCESS,
    error_message: '',
    data: {}
  };

  // Validate inputs
  if (!orgName || !url) {
    result.error_code = ERROR_CODES.SETTINGS_NOT_FOUND;
    result.error_message = `Missing required parameters: org_name=${orgName}, url=${url}`;
    return result;
  }

  try {
    // Try requests first
    let html = await fetchHtmlByRequests(url);

    // Fallback to Playwright if requests fails
    if (html.length < 10) {
      console.log(`Retrying with Playwright for detail: ${orgName}`);
      html = await fetchHtmlByPlaywright(url);
    }

    // Check if HTML was fetched
    if (html.length < 10) {
      result.error_code = ERROR_CODES.PAGE_ACCESS_ERROR;
      result.error_message = `Failed to fetch page: ${url}`;
      return result;
    }

    // Save HTML for debugging
    if (debug) {
      const fs = await import('fs');
      const path = await import('path');
      const downloadsDir = path.join(process.cwd(), 'downloads');
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(downloadsDir, `${orgName}_detail.html`), html);
    }

    // Parse settings and extract data
    const unpackedSettings = unpackSettingsElements(settings);
    const detailData = parseDetailFromHtml(html, unpackedSettings);

    // Add basic info
    detailData.detail_url = url;
    detailData.org_name = orgName;

    result.data = detailData;

  } catch (e) {
    result.error_code = ERROR_CODES.UNKNOWN_ERROR;
    result.error_message = `Error during scraping: ${e}`;
  }

  return result;
}

// Fetch detail by nid
async function fetchDetailByNid(nid: number, debug: boolean = false): Promise<Partial<NoticeDetail> | null> {
  try {
    // Get notice info from database
    const noticeData = await findNoticeByNid(nid);
    if (!noticeData) {
      console.log(`Notice not found for nid: ${nid}`);
      return null;
    }

    const url = noticeData.detail_url;
    const orgName = noticeData.org_name;

    // Get detail settings
    const settings = await findSettingsNoticeDetailByOrgName(orgName);
    if (!settings) {
      console.log(`Settings not found for org: ${orgName}`);
      return null;
    }

    // Scrape detail
    const scrapeResult = await scrapeDetailBySettings(url, orgName, settings, debug);

    if (scrapeResult.error_code !== ERROR_CODES.SUCCESS) {
      console.error(`Failed to scrape detail: ${scrapeResult.error_message}`);
      return null;
    }

    // Merge with DB data
    const detail: Partial<NoticeDetail> = {
      ...scrapeResult.data,
      created_at: noticeData.created_at || getNow(),
      posted_date: noticeData.posted_date || getNow('%Y-%m-%d'),
      posted_by: noticeData.posted_by || '',
      category: noticeData.category || '공사점검'
    };

    return detail;
  } catch (e) {
    console.error(`Error fetching detail by nid: ${e}`);
    return null;
  }
}

// Upsert detail by nid
async function upsertDetailByNid(nid: number, debug: boolean = false): Promise<Partial<NoticeDetail> | null> {
  try {
    const detailData = await fetchDetailByNid(nid, debug);
    if (!detailData) {
      return null;
    }

    // Add nid
    detailData.nid = nid;

    // Format datetime fields
    if (detailData.created_at && typeof detailData.created_at !== 'string') {
      detailData.created_at = getNow();
    }
    if (detailData.posted_date && typeof detailData.posted_date !== 'string') {
      detailData.posted_date = getNow('%Y-%m-%d');
    }

    // Upsert to database
    const db = createMySQLPool();
    await db.upsert(TABLE_DETAILS, {
      data: detailData as any,
      updateData: detailData as any
    });

    return detailData;
  } catch (e) {
    console.error(`Error upserting detail by nid: ${e}`);
    return null;
  }
}

// Process multiple nids
async function processDetailsByNids(nids: number[], debug: boolean = false): Promise<void> {
  console.log(`Processing ${nids.length} nids for detail scraping...`);

  for (let i = 0; i < nids.length; i++) {
    const nid = nids[i];
    console.log(`[${i + 1}/${nids.length}] Processing nid: ${nid}`);

    try {
      await upsertDetailByNid(nid, debug);
      console.log(`  ✓ Success`);
    } catch (e) {
      console.log(`  ✗ Failed: ${e}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('All details processed!');
}

// Exports
export {
  ERROR_CODES,
  createMySQLPool,
  validStr,
  getNow,
  findSettingsNoticeDetailByOrgName,
  findNoticeByNid,
  fetchHtmlByRequests,
  fetchHtmlByPlaywright,
  unpackSettingsElements,
  extractValueByXpath,
  extractValuesByXpath,
  parseDetailFromHtml,
  scrapeDetailBySettings,
  fetchDetailByNid,
  upsertDetailByNid,
  processDetailsByNids
};

export type {
  DetailSettings,
  NoticeDetail,
  ScrapeDetailResult
};

export default {
  ERROR_CODES,
  createMySQLPool,
  scrapeDetailBySettings,
  fetchDetailByNid,
  upsertDetailByNid,
  processDetailsByNids
};
