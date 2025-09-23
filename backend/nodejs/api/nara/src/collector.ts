/**
 * Bid notice collector
 * Handles data collection from Korean government APIs with parsing and error handling
 */

import { DataGoKrApiClient, BidNoticeRawItem } from './api-client.js';
import { BidNoticeParser } from './parser.js';
import { G2bNotice, CollectionResult } from './models.js';

export class BidNoticeCollector {
  private apiClient: DataGoKrApiClient;
  private parser: typeof BidNoticeParser;

  constructor(serviceKey: string) {
    this.apiClient = new DataGoKrApiClient(serviceKey);
    this.parser = BidNoticeParser;
  }

  /**
   * Collect daily bid notices
   */
  async collectDailyNotices(
    targetDate?: Date,
    areaCode?: string,
    orgName?: string,
    bidKind?: string
  ): Promise<{ result: CollectionResult; notices: G2bNotice[] }> {
    const currentDate = targetDate || new Date();

    console.log(`[Collector] Starting daily collection for: ${currentDate.toISOString().split('T')[0]}`);

    const result: CollectionResult = {
      total_count: 0,
      collected_count: 0,
      new_count: 0,
      updated_count: 0,
      error_count: 0,
      errors: []
    };

    try {
      // Make API call
      const apiResult = await this.apiClient.getAllBidList(
        currentDate,
        currentDate,
        areaCode,
        orgName,
        bidKind
      );

      result.total_count = apiResult.length;
      console.log(`[Collector] Received ${result.total_count} notices from API`);

      // Parse data
      const parsedNotices: BidNotice[] = [];

      for (const rawItem of apiResult) {
        try {
          const parsedItem = this.parser.parseBidNotice(rawItem);

          // Validate parsed item
          if (this.parser.validateBidNotice(parsedItem)) {
            parsedNotices.push(parsedItem);
            result.collected_count++;
          } else {
            const errorMsg = `Validation failed for notice: ${parsedItem.bid_notice_no}`;
            console.warn(`[Collector] ${errorMsg}`);
            result.errors.push(errorMsg);
            result.error_count++;
          }
        } catch (error: any) {
          const errorMsg = `Parsing error: ${error.message} | Data: ${JSON.stringify(rawItem).substring(0, 200)}...`;
          console.error(`[Collector] ${errorMsg}`);
          result.errors.push(errorMsg);
          result.error_count++;
        }
      }

      console.log(`[Collector] Parsing completed: ${result.collected_count} successful, ${result.error_count} failed`);

      return { result, notices: parsedNotices };

    } catch (error: any) {
      const errorMsg = `Collection error: ${error.message}`;
      console.error(`[Collector] ${errorMsg}`);
      result.errors.push(errorMsg);
      result.error_count++;
      return { result, notices: [] };
    }
  }

  /**
   * Collect bid notices for a date range
   */
  async collectPeriodNotices(
    startDate: Date,
    endDate: Date,
    areaCode?: string,
    orgName?: string,
    bidKind?: string
  ): Promise<{ result: CollectionResult; notices: BidNotice[] }> {
    console.log(`[Collector] Starting period collection: ${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}`);

    const totalResult: CollectionResult = {
      total_count: 0,
      collected_count: 0,
      new_count: 0,
      updated_count: 0,
      error_count: 0,
      errors: []
    };

    const allParsedNotices: BidNotice[] = [];

    // Iterate through each date
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      try {
        const { result: dailyResult, notices: dailyNotices } = await this.collectDailyNotices(
          new Date(currentDate),
          areaCode,
          orgName,
          bidKind
        );

        // Accumulate results
        totalResult.total_count += dailyResult.total_count;
        totalResult.collected_count += dailyResult.collected_count;
        totalResult.error_count += dailyResult.error_count;
        totalResult.errors.push(...dailyResult.errors);

        allParsedNotices.push(...dailyNotices);

        console.log(`[Collector] ${currentDate.toISOString().split('T')[0]} completed: ${dailyResult.collected_count} notices`);

        // Add delay between date requests to avoid rate limiting
        await this.delay(1000);

      } catch (error: any) {
        const errorMsg = `${currentDate.toISOString().split('T')[0]} collection error: ${error.message}`;
        console.error(`[Collector] ${errorMsg}`);
        totalResult.errors.push(errorMsg);
        totalResult.error_count++;
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`[Collector] Period collection completed: total ${totalResult.collected_count} notices`);
    return { result: totalResult, notices: allParsedNotices };
  }

  /**
   * Collect latest notices (last N days)
   */
  async collectLatestNotices(days: number = 3): Promise<{ result: CollectionResult; notices: BidNotice[] }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`[Collector] Collecting latest notices for last ${days} days`);

    return await this.collectPeriodNotices(startDate, endDate);
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(): Promise<{
    total_api_calls: number;
    total_notices_collected: number;
    last_collection_date: string | null;
    error_rate: number;
  }> {
    // This would typically query the database for statistics
    // For now, returning default values
    return {
      total_api_calls: 0,
      total_notices_collected: 0,
      last_collection_date: null,
      error_rate: 0
    };
  }

  /**
   * Validate collection parameters
   */
  private validateCollectionParams(startDate?: Date, endDate?: Date): void {
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Start date cannot be later than end date');
    }

    if (startDate && startDate > new Date()) {
      throw new Error('Start date cannot be in the future');
    }

    // Add more validation rules as needed
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('[Collector] Cleanup completed');
  }
}

/**
 * Test collector functionality
 */
export async function testCollector(): Promise<void> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

  if (!serviceKey) {
    console.error('[Test] Error: SERVICE_KEY not found in environment variables');
    return;
  }

  const collector = new BidNoticeCollector(serviceKey);

  try {
    // Test daily collection
    console.log('=== Testing Daily Collection ===');
    const { result, notices } = await collector.collectDailyNotices();

    console.log('=== Collection Results ===');
    console.log(`Total count: ${result.total_count}`);
    console.log(`Collected count: ${result.collected_count}`);
    console.log(`Error count: ${result.error_count}`);

    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (notices.length > 0) {
      console.log('\n=== First Notice (Parsed Data) ===');
      const firstNotice = notices[0];
      Object.entries(firstNotice).forEach(([key, value]) => {
        if (key !== 'raw_data') { // Skip raw data for readability
          console.log(`${key}: ${value}`);
        }
      });
    }

    console.log('\n=== Collection Stats ===');
    const stats = await collector.getCollectionStats();
    console.log(JSON.stringify(stats, null, 2));

  } catch (error: any) {
    console.error(`[Test] Test failed: ${error.message}`);
  } finally {
    collector.cleanup();
  }
}