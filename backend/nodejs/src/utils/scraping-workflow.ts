// Shared scraping workflow that can be used by both API scripts and GraphQL resolvers
import { chromium, Browser } from 'playwright';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type {
  ScrapingSettings,
  ScrapedNotice,
  WorkflowResult,
  ScrapingLog,
  CategorySettings,
  ScrapingResult,
  ERROR_CODES
} from '@/types/scraping';
import {
  formatDate,
  getCurrentTimestamp,
  xpathToSelector,
  cleanText,
  createLogger,
  makeAbsoluteUrl
} from '@/utils/scraping-utils';

const logger = createLogger('scraping-workflow');

export class ScrapingWorkflow {
  private browser: Browser | null = null;
  private classifier: NoticeClassifier | null = null;

  async initialize(): Promise<void> {
    // Initialize browser with custom executable path if provided
    const launchOptions: any = {
      headless: process.env.HEADLESS !== 'false'
    };

    // Use custom Chromium executable path if specified
    if (process.env.CHROMIUM_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
      logger.info(`Using custom Chromium path: ${process.env.CHROMIUM_EXECUTABLE_PATH}`);
    }

    this.browser = await chromium.launch(launchOptions);

    // Load category settings for classification
    const categorySettings = await this.loadCategorySettings();
    this.classifier = new NoticeClassifier(categorySettings);

    logger.info('Scraping workflow initialized');
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    logger.info('Scraping workflow cleaned up');
  }

  async processSingleAgency(orgName: string, debug: boolean = false): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      success: false,
      error_code: 0, // ERROR_CODES.SUCCESS
      error_message: '',
      scraped_count: 0,
      new_count: 0,
      inserted_count: 0
    };

    try {
      logger.info(`Processing agency: ${orgName}`);

      // Step 1: Get scraping settings and scrape
      const settings = await this.getSettingsByOrgName(orgName);
      if (!settings) {
        result.error_code = 100; // ERROR_CODES.SETTINGS_NOT_FOUND
        result.error_message = `Settings not found for ${orgName}`;
        result.log = this.createScrapingLog(orgName, 0, 0, 0, {
          error_code: result.error_code,
          error_message: result.error_message
        });
        return result;
      }

      const scrapeResult = await this.scrapeBySettings(settings, debug);
      if (scrapeResult.error_code !== 0) {
        result.error_code = scrapeResult.error_code;
        result.error_message = scrapeResult.error_message;
        result.log = this.createScrapingLog(orgName, 0, 0, 0, {
          error_code: result.error_code,
          error_message: result.error_message
        });
        return result;
      }

      result.scraped_count = scrapeResult.data.length;

      if (result.scraped_count === 0) {
        result.success = true;
        result.log = this.createScrapingLog(orgName, 0, 0, 0);
        return result;
      }

      // Step 2: Filter new notices only
      const newNotices = await this.filterNewNotices(scrapeResult.data, orgName);
      result.new_count = newNotices.length;

      if (result.new_count === 0) {
        result.success = true;
        result.log = this.createScrapingLog(orgName, result.scraped_count, 0, 0);
        return result;
      }

      // Step 3: Classify notices by category
      if (!this.classifier) {
        throw new Error('Classifier not initialized');
      }

      const classifiedNotices = this.classifier.classifyNotices(newNotices);

      // Step 4: Filter valid categories (exclude '무관')
      const validNotices = this.classifier.filterValidCategoryNotices(classifiedNotices);

      if (validNotices.length === 0) {
        result.success = true;
        result.log = this.createScrapingLog(orgName, result.scraped_count, result.new_count, 0);
        return result;
      }

      // Step 5: Insert valid notices to database
      const insertedCount = await this.insertNotices(validNotices);
      result.inserted_count = insertedCount;

      // Success
      result.success = true;
      result.log = this.createScrapingLog(
        orgName,
        result.scraped_count,
        result.new_count,
        result.inserted_count
      );

      logger.info(`  - Scraped: ${result.scraped_count}, New: ${result.new_count}, Inserted: ${result.inserted_count}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.error_code = 900; // ERROR_CODES.UNKNOWN_ERROR
      result.error_message = `Agency ${orgName} processing error: ${errorMessage}`;
      result.log = this.createScrapingLog(
        orgName,
        result.scraped_count,
        result.new_count,
        result.inserted_count,
        {
          error_code: result.error_code,
          error_message: result.error_message
        }
      );

      logger.error(`  - Error: ${result.error_message}`);
    }

    return result;
  }

  async processMultipleAgencies(orgNames: string[], debug: boolean = false): Promise<{
    total_agencies: number;
    error_agencies: number;
    total_scraped: number;
    total_new: number;
    total_inserted: number;
    logs: ScrapingLog[];
    error_orgs: string[];
  }> {
    const startTime = getCurrentTimestamp();
    logger.info(`@@@ Scrape Notices (New Workflow) At: ${startTime}`);
    logger.info('='.repeat(100));

    const logs: ScrapingLog[] = [];
    const errorOrgs: string[] = [];

    let totalScraped = 0;
    let totalNew = 0;
    let totalInserted = 0;

    for (const orgName of orgNames) {
      const result = await this.processSingleAgency(orgName, debug);

      totalScraped += result.scraped_count;
      totalNew += result.new_count;
      totalInserted += result.inserted_count;

      if (result.log) {
        logs.push(result.log);
      }

      if (!result.success) {
        errorOrgs.push(orgName);
      }
    }

    // Save logs and errors to database
    if (logs.length > 0) {
      await this.insertLogs(logs);
    }

    if (errorOrgs.length > 0) {
      await this.insertErrors({
        orgs: errorOrgs.join(','),
        time: getCurrentTimestamp()
      });
    }

    logger.info('-'.repeat(60));
    logger.info(`@@@ Summary: Agencies: ${orgNames.length}, Errors: ${errorOrgs.length}`);
    logger.info(`@@@ Total - Scraped: ${totalScraped}, New: ${totalNew}, Inserted: ${totalInserted}`);
    logger.info('='.repeat(100));

    return {
      total_agencies: orgNames.length,
      error_agencies: errorOrgs.length,
      total_scraped: totalScraped,
      total_new: totalNew,
      total_inserted: totalInserted,
      logs,
      error_orgs: errorOrgs
    };
  }

  async scrapeBySettings(settings: ScrapingSettings, debug: boolean = false): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      org_name: settings.org_name,
      error_code: 0,
      error_message: '',
      data: []
    };

    try {
      // First try with axios/cheerio (faster)
      const axiosData = await this.scrapeWithAxios(settings, debug);

      // If not enough data, retry with Playwright
      if (axiosData.length < 5) {
        logger.info(`################# playwright retry for ${settings.org_name}`);
        const playwrightData = await this.scrapeWithPlaywright(settings, debug);
        result.data = playwrightData;
      } else {
        result.data = axiosData;
      }

      // Filter out notices without titles
      result.data = result.data.filter(notice => notice.title && notice.title.trim() !== '');

      // Reverse to get newest first
      result.data.reverse();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.error_code = 900; // ERROR_CODES.UNKNOWN_ERROR
      result.error_message = `Scraping error: ${errorMessage}`;
    }

    return result;
  }

  private async scrapeWithAxios(settings: ScrapingSettings, debug: boolean): Promise<ScrapedNotice[]> {
    const allData: ScrapedNotice[] = [];
    const { org_name, url, startPage, endPage, rowXpath, elements } = settings;

    // Parse elements JSON
    const elementsObj = JSON.parse(elements);

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      try {
        const pageUrl = url.includes('${i}') ? url.replace('${i}', pageNum.toString()) : url;

        const response = await axios.get(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          timeout: 30000
        });

        const pageData = this.parseHtmlWithCheerio(response.data, rowXpath, elementsObj, org_name, pageUrl);

        if (debug && pageData.length > 0) {
          logger.debug(`Page ${pageNum}: ${pageData.length} notices found`);
        }

        allData.push(...pageData);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error scraping page ${pageNum}: ${errorMessage}`);
      }
    }

    return allData;
  }

  private async scrapeWithPlaywright(settings: ScrapingSettings, debug: boolean): Promise<ScrapedNotice[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const allData: ScrapedNotice[] = [];
    const { org_name, url, startPage, endPage, rowXpath, elements } = settings;
    const elementsObj = JSON.parse(elements);

    const page = await this.browser.newPage();

    try {
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        try {
          const pageUrl = url.includes('${i}') ? url.replace('${i}', pageNum.toString()) : url;

          await page.goto(pageUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });

          // Wait for content to load
          await page.waitForLoadState('networkidle', { timeout: 10000 });

          // Wait for the row elements to be present
          await page.waitForSelector(xpathToSelector(rowXpath), { timeout: 10000 });

          const content = await page.content();
          const pageData = this.parseHtmlWithCheerio(content, rowXpath, elementsObj, org_name, pageUrl);

          if (debug && pageData.length > 0) {
            logger.debug(`Playwright Page ${pageNum}: ${pageData.length} notices found`);
          }

          allData.push(...pageData);

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error(`Error scraping page ${pageNum} with Playwright: ${errorMessage}`);
        }
      }
    } finally {
      await page.close();
    }

    return allData;
  }

  private parseHtmlWithCheerio(
    html: string,
    rowXpath: string,
    elementsObj: any,
    orgName: string,
    baseUrl: string
  ): ScrapedNotice[] {
    const notices: ScrapedNotice[] = [];
    const $ = cheerio.load(html);
    const rowSelector = xpathToSelector(rowXpath);

    $(rowSelector).each((_index, row) => {
      const $row = $(row);
      const notice: ScrapedNotice = {
        title: '',
        detail_url: '',
        posted_date: '',
        posted_by: '',
        org_name: orgName,
        scraped_at: getCurrentTimestamp()
      };

      // Extract each field based on xpath
      for (const [key, config] of Object.entries(elementsObj) as [string, any][]) {
        if (config.xpath) {
          const selector = xpathToSelector(config.xpath);
          let value = '';

          if (selector.includes('a[href') || key === 'detail_url') {
            // Handle links
            const $link = $row.find('a').first();
            if (key === 'detail_url') {
              value = $link.attr('href') || '';
              // Make absolute URL if relative
              if (value && !value.startsWith('http')) {
                value = makeAbsoluteUrl(value, baseUrl);
              }
            } else {
              value = cleanText($link.text());
            }
          } else {
            // Regular text extraction
            const $element = selector ? $row.find(selector) : $row;
            value = cleanText($element.text());
          }

          (notice as any)[key] = value;
        }
      }

      // Format date
      if (notice.posted_date) {
        notice.posted_date = formatDate(notice.posted_date);
      }

      // Only add if has title
      if (notice.title && notice.title.trim() !== '') {
        notices.push(notice);
      }
    });

    return notices;
  }

  // Database interaction methods (to be implemented with actual database)
  private async getSettingsByOrgName(orgName: string): Promise<ScrapingSettings | null> {
    // TODO: Implement database query to get scraping settings
    logger.warn(`TODO: Implement getSettingsByOrgName for ${orgName}`);
    return null;
  }

  private async loadCategorySettings(): Promise<CategorySettings[]> {
    // TODO: Implement database query to load category settings
    logger.warn('TODO: Implement loadCategorySettings');
    return [];
  }

  private async filterNewNotices(scrapedData: ScrapedNotice[], orgName: string): Promise<ScrapedNotice[]> {
    // TODO: Implement database query to filter new notices
    logger.warn(`TODO: Implement filterNewNotices for ${orgName}`);
    return scrapedData; // Return all for now
  }

  private async insertNotices(notices: ScrapedNotice[]): Promise<number> {
    // TODO: Implement database insertion
    logger.warn(`TODO: Implement insertNotices for ${notices.length} notices`);
    return notices.length; // Return count for now
  }

  private async insertLogs(logs: ScrapingLog[]): Promise<void> {
    // TODO: Implement database log insertion
    logger.warn(`TODO: Implement insertLogs for ${logs.length} logs`);
  }

  private async insertErrors(error: { orgs: string; time: string }): Promise<void> {
    // TODO: Implement database error insertion
    logger.warn(`TODO: Implement insertErrors for ${error.orgs}`);
  }

  private createScrapingLog(
    orgName: string,
    scrapedCount: number,
    newCount: number,
    insertedCount: number,
    errorInfo?: { error_code: number; error_message: string }
  ): ScrapingLog {
    return {
      org_name: orgName,
      error: errorInfo || null,
      scraped_count: scrapedCount,
      new_count: newCount,
      inserted_count: insertedCount,
      time: getCurrentTimestamp()
    };
  }
}

// Notice classifier
export class NoticeClassifier {
  private categorySettings: CategorySettings[] = [];

  constructor(categorySettings: CategorySettings[]) {
    this.categorySettings = categorySettings;
  }

  classifyNotices(notices: ScrapedNotice[]): ScrapedNotice[] {
    if (!notices || notices.length === 0) {
      return [];
    }

    // Initialize all notices with default category
    notices.forEach(notice => {
      notice.category = '무관';
    });

    // Classify each notice based on category settings
    for (const setting of this.categorySettings) {
      for (const notice of notices) {
        if (notice.category === '무관') { // Only classify if still unclassified
          if (this.matchesCategoryCriteria(notice.title, setting)) {
            notice.category = setting.category;
          }
        }
      }
    }

    return notices;
  }

  filterValidCategoryNotices(notices: ScrapedNotice[]): ScrapedNotice[] {
    // Filter out notices with '무관' category - only keep meaningful categories
    const validCategories = new Set(['공사점검', '성능평가', '기타']);
    return notices.filter(notice => validCategories.has(notice.category as any));
  }

  private matchesCategoryCriteria(title: string, setting: CategorySettings): boolean {
    if (!title) {
      return false;
    }

    // Check exclusion words first
    if (setting.nots) {
      const notWords = setting.nots.split(',').map(word => word.trim()).filter(word => word);
      for (const notWord of notWords) {
        if (title.includes(notWord)) {
          return false;
        }
      }
    }

    // Calculate keyword score
    if (!setting.keywords) {
      return false;
    }

    let totalScore = 0;
    const keywordItems = setting.keywords.split(',').map(item => item.trim()).filter(item => item);

    for (const item of keywordItems) {
      if (item.includes('*')) {
        const parts = item.split('*');
        if (parts.length === 2) {
          const keyword = parts[0].trim();
          const weightStr = parts[1].trim();

          try {
            const weight = parseInt(weightStr);
            if (title.includes(keyword)) {
              totalScore += weight;
            }
          } catch (error) {
            continue;
          }
        }
      } else {
        // No weight specified, default to 1
        if (title.includes(item)) {
          totalScore += 1;
        }
      }
    }

    return totalScore >= setting.min_point;
  }
}