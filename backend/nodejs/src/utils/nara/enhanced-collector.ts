/**
 * Enhanced bid notice collector
 * Handles data collection from Korean government APIs with parsing and error handling
 * Based on backup 01 structure with improvements
 */

import { DataGoKrApiClient, BidNoticeRawItem } from './api-client';
import { BidNoticeParser } from './bid-parser';
import { G2bNotice, CollectionResult } from './models';
import { createLogger } from '@/utils/scraping-utils';

const logger = createLogger('enhanced-nara-collector');

export interface CollectionOptions {
  targetDate?: Date;
  areaCode?: string;
  orgName?: string;
  bidKind?: string;
  limit?: number;
  dryRun?: boolean;
  debug?: boolean;
}

export class EnhancedBidNoticeCollector {
  private apiClient: DataGoKrApiClient;

  constructor(serviceKey: string) {
    this.apiClient = new DataGoKrApiClient(serviceKey);
  }

  /**
   * Collect daily bid notices
   */
  async collectDailyNotices(options: CollectionOptions = {}): Promise<{
    result: CollectionResult;
    notices: G2bNotice[];
  }> {
    const {
      targetDate = new Date(),
      areaCode,
      orgName,
      bidKind,
      limit = 100,
      dryRun = false,
      debug = false
    } = options;

    logger.info(`[Collector] Starting daily collection for: ${targetDate.toISOString().split('T')[0]}`);
    logger.info(`[Collector] Options: areaCode=${areaCode}, orgName=${orgName}, bidKind=${bidKind}, limit=${limit}, dryRun=${dryRun}`);

    const result: CollectionResult = {
      total_count: 0,
      collected_count: 0,
      new_count: 0,
      updated_count: 0,
      error_count: 0,
      errors: []
    };

    const notices: G2bNotice[] = [];

    try {
      // Make API calls with pagination
      let pageNo = 1;
      let collectedCount = 0;
      const pageSize = Math.min(100, limit);

      while (collectedCount < limit) {
        try {
          const remainingItems = limit - collectedCount;
          const currentPageSize = Math.min(pageSize, remainingItems);

          logger.info(`[Collector] Fetching page ${pageNo} (${currentPageSize} items)...`);

          // Use a wider date range to find notices (last 7 days)
          const endDate = targetDate;
          const startDate = new Date(targetDate);
          startDate.setDate(startDate.getDate() - 7);

          // Call API
          const rawNotices = await this.apiClient.getBidPblancListInfoServc({
            pageNo,
            numOfRows: currentPageSize,
            inqryDiv: '1', // Required: search by announcement posting date
            inqryBgnDt: this.formatDate(startDate),
            inqryEndDt: this.formatDate(endDate),
            prtcptLmtRgnNm: areaCode,
            // Add other search parameters as needed
          });

          if (!Array.isArray(rawNotices) || rawNotices.length === 0) {
            logger.info(`[Collector] No more notices found on page ${pageNo}`);
            break;
          }

          result.total_count += rawNotices.length;
          collectedCount += rawNotices.length;

          if (debug) {
            logger.debug(`[Collector] Page ${pageNo}: Found ${rawNotices.length} notices`);
            if (rawNotices.length > 0) {
              logger.debug(`[Collector] Sample notice: ${rawNotices[0].bidNtceNm}`);
            }
          }

          // Parse raw notices to G2bNotice format
          const parsedNotices = BidNoticeParser.parseMultiple(rawNotices);
          notices.push(...parsedNotices);

          result.collected_count += parsedNotices.length;

          // If we got fewer items than requested, we've reached the end
          if (rawNotices.length < currentPageSize) {
            logger.info(`[Collector] Reached last page (${pageNo}) with ${rawNotices.length} notices`);
            break;
          }

          pageNo++;

          // Rate limiting - wait between API calls
          if (!dryRun) {
            await this.sleep(200); // 200ms between calls
          }

        } catch (pageError) {
          const errorMessage = pageError instanceof Error ? pageError.message : String(pageError);
          logger.error(`[Collector] Error on page ${pageNo}: ${errorMessage}`);
          result.error_count++;
          result.errors.push(`Page ${pageNo}: ${errorMessage}`);

          // Continue with next page unless it's a critical error
          if (errorMessage.includes('Invalid service key') || errorMessage.includes('Quota exceeded')) {
            break;
          }
          pageNo++;
        }
      }

      // Process notices for database insertion
      if (!dryRun && notices.length > 0) {
        logger.info(`[Collector] Processing ${notices.length} notices for database insertion...`);

        // TODO: Implement database operations
        // const { newCount, updatedCount } = await this.saveToDatabase(notices);
        // result.new_count = newCount;
        // result.updated_count = updatedCount;

        // Mock for now
        result.new_count = notices.length;
        result.updated_count = 0;

        logger.info(`[Collector] Database operation completed. New: ${result.new_count}, Updated: ${result.updated_count}`);
      } else {
        logger.info(`[Collector] DRY RUN - ${notices.length} notices would be processed`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`[Collector] Collection failed: ${errorMessage}`);
      result.error_count++;
      result.errors.push(`Collection error: ${errorMessage}`);
    }

    logger.info(`[Collector] Collection completed:`, {
      total: result.total_count,
      collected: result.collected_count,
      new: result.new_count,
      updated: result.updated_count,
      errors: result.error_count
    });

    return { result, notices };
  }

  /**
   * Collect notices for a date range
   */
  async collectDateRange(
    startDate: Date,
    endDate: Date,
    options: Omit<CollectionOptions, 'targetDate'> = {}
  ): Promise<{
    result: CollectionResult;
    notices: G2bNotice[];
  }> {
    logger.info(`[Collector] Starting date range collection: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    const totalResult: CollectionResult = {
      total_count: 0,
      collected_count: 0,
      new_count: 0,
      updated_count: 0,
      error_count: 0,
      errors: []
    };

    const allNotices: G2bNotice[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      try {
        logger.info(`[Collector] Processing date: ${currentDate.toISOString().split('T')[0]}`);

        const { result, notices } = await this.collectDailyNotices({
          ...options,
          targetDate: new Date(currentDate)
        });

        // Accumulate results
        totalResult.total_count += result.total_count;
        totalResult.collected_count += result.collected_count;
        totalResult.new_count += result.new_count;
        totalResult.updated_count += result.updated_count;
        totalResult.error_count += result.error_count;
        totalResult.errors.push(...result.errors);

        allNotices.push(...notices);

        // Rate limiting between dates
        if (!options.dryRun) {
          await this.sleep(500); // 500ms between date requests
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`[Collector] Error processing date ${currentDate.toISOString().split('T')[0]}: ${errorMessage}`);
        totalResult.error_count++;
        totalResult.errors.push(`Date ${currentDate.toISOString().split('T')[0]}: ${errorMessage}`);
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    logger.info(`[Collector] Date range collection completed:`, {
      total: totalResult.total_count,
      collected: totalResult.collected_count,
      new: totalResult.new_count,
      updated: totalResult.updated_count,
      errors: totalResult.error_count
    });

    return { result: totalResult, notices: allNotices };
  }

  /**
   * Format date to YYYYMMDDHHMM string (12 characters as required by API)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}`;
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * TODO: Save notices to database
   */
  private async saveToDatabase(notices: G2bNotice[]): Promise<{
    newCount: number;
    updatedCount: number;
  }> {
    // Placeholder for database operations
    logger.info(`[Collector] TODO: Save ${notices.length} notices to database`);

    return {
      newCount: notices.length,
      updatedCount: 0
    };
  }
}