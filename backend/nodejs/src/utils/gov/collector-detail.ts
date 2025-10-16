/**
 * Government notice detail collector - Based on Python spider_detail.py
 * Handles detailed content scraping from Korean government agency websites
 */

import { Browser, chromium, Page } from 'playwright';
import { createLogger, cleanText, formatDate, makeAbsoluteUrl } from '@/utils/scraping-utils';

const logger = createLogger('gov-detail-collector');

export interface GovDetailCollectionOptions {
  orgName?: string;
  noticeId?: string;
  limit?: number;
  dryRun?: boolean;
  debug?: boolean;
}

export interface GovDetailResult {
  success: boolean;
  processed: number;
  updated: number;
  errors: string[];
}

export interface NoticeDetail {
  nid: string;
  title: string;
  content: string;
  attachments: AttachmentFile[];
  org_name: string;
  scraped_at: string;
}

export interface AttachmentFile {
  filename: string;
  url: string;
  size?: string;
}

/**
 * Collect detailed information for government notices
 */
export async function collectGovNoticeDetails(options: GovDetailCollectionOptions = {}): Promise<GovDetailResult> {
  const {
    orgName,
    noticeId,
    limit = 10,
    dryRun = false,
    debug = false
  } = options;

  logger.info(`Starting GOV detail collection${noticeId ? ` for notice: ${noticeId}` : ` (limit: ${limit})`}`);

  if (orgName) {
    logger.info(`Targeting organization: ${orgName}`);
  }

  if (dryRun) {
    logger.info('DRY RUN MODE: No data will be saved to database');
    return {
      success: true,
      processed: noticeId ? 1 : limit,
      updated: 0,
      errors: []
    };
  }

  try {
    // Get notices to process details for
    const noticesToProcess = await getNoticesForDetailCollection(orgName, noticeId, limit);

    if (noticesToProcess.length === 0) {
      logger.warn('No notices found for detail collection');
      return {
        success: true,
        processed: 0,
        updated: 0,
        errors: []
      };
    }

    logger.info(`Processing details for ${noticesToProcess.length} notices`);

    let processed = 0;
    let updated = 0;
    const errors: string[] = [];

    const browser = await chromium.launch({ headless: true });

    try {
      for (const notice of noticesToProcess) {
        try {
          const detailResult = await scrapeNoticeDetail(browser, notice, debug);
          processed++;

          if (detailResult.success) {
            // TODO: Save to database
            updated++;
            logger.info(`TODO: Save detail for notice ${notice.nid}`);
          } else {
            errors.push(`${notice.nid}: ${detailResult.error}`);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`${notice.nid}: ${errorMessage}`);
          logger.error(`Error processing notice ${notice.nid}: ${errorMessage}`);
          processed++;
        }
      }
    } finally {
      await browser.close();
    }

    return {
      success: errors.length === 0 || errors.length < processed / 2,
      processed,
      updated,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`GOV detail collection failed: ${errorMessage}`);

    return {
      success: false,
      processed: 0,
      updated: 0,
      errors: [errorMessage]
    };
  }
}

/**
 * Scrape detailed content for a single notice
 */
async function scrapeNoticeDetail(
  browser: Browser,
  notice: { nid: string; title: string; detail_url: string; org_name: string },
  debug: boolean
): Promise<{ success: boolean; detail?: NoticeDetail; error?: string }> {

  if (!notice.detail_url) {
    return { success: false, error: 'No detail URL provided' };
  }

  const page = await browser.newPage();

  try {
    if (debug) {
      logger.debug(`Scraping detail for: ${notice.title}`);
      logger.debug(`URL: ${notice.detail_url}`);
    }

    await page.goto(notice.detail_url, { waitUntil: 'networkidle' });

    // Extract content (this would be configured per organization)
    const content = await extractNoticeContent(page, notice.org_name, debug);
    const attachments = await extractAttachments(page, notice.org_name, debug);

    const detail: NoticeDetail = {
      nid: notice.nid,
      title: notice.title,
      content: content || '',
      attachments: attachments || [],
      org_name: notice.org_name,
      scraped_at: new Date().toISOString()
    };

    return { success: true, detail };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to scrape detail for ${notice.nid}: ${errorMessage}`);
    return { success: false, error: errorMessage };
  } finally {
    await page.close();
  }
}

/**
 * Extract main content from notice detail page
 */
async function extractNoticeContent(page: Page, orgName: string, debug: boolean): Promise<string> {
  // Common content selectors for government websites
  const contentSelectors = [
    '.content', '.board-content', '.view-content',
    '#content', '#board-content',
    '.post-content', '.article-content',
    'div[class*="content"]', 'div[class*="view"]'
  ];

  for (const selector of contentSelectors) {
    try {
      const element = page.locator(selector).first();
      const content = await element.textContent();

      if (content && content.trim().length > 50) {
        return cleanText(content);
      }
    } catch (error) {
      if (debug) {
        logger.debug(`Content selector ${selector} failed: ${error}`);
      }
    }
  }

  // Fallback: try to get page text content
  try {
    const bodyText = await page.locator('body').textContent();
    return cleanText(bodyText || '');
  } catch (error) {
    logger.warn(`Failed to extract any content for ${orgName}`);
    return '';
  }
}

/**
 * Extract attachment files from notice detail page
 */
async function extractAttachments(page: Page, orgName: string, debug: boolean): Promise<AttachmentFile[]> {
  const attachments: AttachmentFile[] = [];

  // Common attachment link selectors
  const attachmentSelectors = [
    'a[href*=".pdf"]', 'a[href*=".doc"]', 'a[href*=".hwp"]',
    'a[href*=".xlsx"]', 'a[href*=".xls"]', 'a[href*=".zip"]',
    '.attach a', '.attachment a', '.file a', '.download a',
    'a[class*="attach"]', 'a[class*="file"]', 'a[class*="download"]'
  ];

  for (const selector of attachmentSelectors) {
    try {
      const links = await page.locator(selector).all();

      for (const link of links) {
        try {
          const href = await link.getAttribute('href');
          const text = await link.textContent();

          if (href && text) {
            const url = href.startsWith('http') ? href : makeAbsoluteUrl(href, page.url());
            const filename = cleanText(text);

            if (filename && !attachments.some(a => a.url === url)) {
              attachments.push({ filename, url });
            }
          }
        } catch (linkError) {
          if (debug) {
            logger.debug(`Failed to process attachment link: ${linkError}`);
          }
        }
      }
    } catch (error) {
      if (debug) {
        logger.debug(`Attachment selector ${selector} failed: ${error}`);
      }
    }
  }

  if (debug && attachments.length > 0) {
    logger.debug(`Found ${attachments.length} attachments`);
  }

  return attachments;
}

/**
 * Get notices that need detail collection
 * TODO: Load from database
 */
async function getNoticesForDetailCollection(
  orgName?: string,
  noticeId?: string,
  limit: number = 10
): Promise<Array<{ nid: string; title: string; detail_url: string; org_name: string }>> {

  // Mock data for testing
  const mockNotices = [
    {
      nid: '1',
      title: '가평군 공공시설 유지보수 용역',
      detail_url: 'https://httpbin.org/html',
      org_name: orgName || '가평군청'
    },
    {
      nid: '2',
      title: '한국공항공사 시설관리 용역',
      detail_url: 'https://httpbin.org/html',
      org_name: orgName || '한국공항공사'
    }
  ];

  if (noticeId) {
    return mockNotices.filter(n => n.nid === noticeId);
  }

  if (orgName) {
    return mockNotices.filter(n => n.org_name === orgName).slice(0, limit);
  }

  return mockNotices.slice(0, limit);
}