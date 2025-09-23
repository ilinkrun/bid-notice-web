/**
 * Service layer for Korean government bid notice system
 * Provides high-level business logic combining API client, parser, collector, and database
 */

import { DatabaseManager, DatabaseConfig } from './database.js';
import { BidNoticeCollector } from './collector.js';
import { BidNotice, CollectionResult } from './models.js';

export interface ServiceConfig extends DatabaseConfig {
  serviceKey: string;
}

export interface CollectionOptions {
  startDate?: Date;
  endDate?: Date;
  areaCode?: string;
  orgName?: string;
  bidKind?: string;
  maxDays?: number;
  applyKeywordMatching?: boolean;
  saveToDatabase?: boolean;
}

export interface ServiceResult {
  success: boolean;
  collection_result: CollectionResult;
  database_result?: {
    saved: number;
    new_count: number;
    updated_count: number;
    errors: string[];
  };
  keyword_processing?: {
    processed: number;
  };
  errors: string[];
  duration_ms: number;
}

export class BidNoticeService {
  private databaseManager: DatabaseManager;
  private collector: BidNoticeCollector;
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
    this.databaseManager = new DatabaseManager(config);
    this.collector = new BidNoticeCollector(config.serviceKey);

    console.log('[Service] Bid Notice Service initialized');
  }

  /**
   * Initialize service (create tables if needed)
   */
  async initialize(dropExistingTables: boolean = false): Promise<void> {
    try {
      console.log('[Service] Initializing service...');
      await this.databaseManager.createTables(dropExistingTables);
      console.log('[Service] Service initialized successfully');
    } catch (error: any) {
      console.error('[Service] Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Collect and process bid notices for today
   */
  async collectTodayNotices(options: CollectionOptions = {}): Promise<ServiceResult> {
    return await this.collectNotices({
      ...options,
      startDate: new Date(),
      endDate: new Date()
    });
  }

  /**
   * Collect and process bid notices for the last N days
   */
  async collectLatestNotices(days: number = 3, options: CollectionOptions = {}): Promise<ServiceResult> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.collectNotices({
      ...options,
      startDate,
      endDate
    });
  }

  /**
   * Collect and process bid notices for a specific date range
   */
  async collectNotices(options: CollectionOptions): Promise<ServiceResult> {
    const startTime = Date.now();
    const result: ServiceResult = {
      success: false,
      collection_result: {
        total_count: 0,
        collected_count: 0,
        new_count: 0,
        updated_count: 0,
        error_count: 0,
        errors: []
      },
      errors: [],
      duration_ms: 0
    };

    try {
      console.log('[Service] Starting bid notice collection...');

      // Default options
      const {
        startDate,
        endDate,
        areaCode,
        orgName,
        bidKind,
        applyKeywordMatching = true,
        saveToDatabase = true
      } = options;

      // Validate date range
      if (startDate && endDate && startDate > endDate) {
        throw new Error('Start date cannot be later than end date');
      }

      // Collect data from API
      let collectionData: { result: CollectionResult; notices: BidNotice[] };

      if (startDate && endDate) {
        // Check if it's a single day or date range
        const isSingleDay = startDate.toDateString() === endDate.toDateString();

        if (isSingleDay) {
          collectionData = await this.collector.collectDailyNotices(
            startDate, areaCode, orgName, bidKind
          );
        } else {
          collectionData = await this.collector.collectPeriodNotices(
            startDate, endDate, areaCode, orgName, bidKind
          );
        }
      } else {
        // Default to today
        collectionData = await this.collector.collectDailyNotices(
          new Date(), areaCode, orgName, bidKind
        );
      }

      result.collection_result = collectionData.result;

      // Save to database if requested
      if (saveToDatabase && collectionData.notices.length > 0) {
        console.log(`[Service] Saving ${collectionData.notices.length} notices to database...`);

        const dbResult = await this.databaseManager.saveBidNotices(collectionData.notices);
        result.database_result = dbResult;

        // Update collection result with database save results
        result.collection_result.new_count = dbResult.new_count;
        result.collection_result.updated_count = dbResult.updated_count;
        result.collection_result.errors.push(...dbResult.errors);

        console.log(`[Service] Database save completed: ${dbResult.saved} notices saved`);
      }

      // Apply keyword matching if requested
      if (applyKeywordMatching && saveToDatabase) {
        console.log('[Service] Applying keyword matching to unprocessed notices...');

        const processed = await this.databaseManager.applyKeywordMatching(1000);
        result.keyword_processing = { processed };

        console.log(`[Service] Keyword matching completed: ${processed} notices processed`);
      }

      // Save collection log
      if (saveToDatabase) {
        try {
          await this.databaseManager.saveCollectionLog(
            'getBidPblancListInfoServc',
            {
              startDate: startDate?.toISOString(),
              endDate: endDate?.toISOString(),
              areaCode,
              orgName,
              bidKind
            },
            result.collection_result,
            startDate,
            endDate,
            new Date(startTime)
          );
        } catch (logError: any) {
          console.error('[Service] Failed to save collection log:', logError.message);
          result.errors.push(`Collection log save failed: ${logError.message}`);
        }
      }

      result.success = result.collection_result.error_count === 0 && result.errors.length === 0;

      console.log(`[Service] Collection completed successfully: ${result.collection_result.collected_count} notices`);

    } catch (error: any) {
      console.error('[Service] Collection failed:', error.message);
      result.errors.push(error.message);
      result.success = false;
    } finally {
      result.duration_ms = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Get service statistics
   */
  async getStatistics() {
    try {
      const dbStats = await this.databaseManager.getStatistics();
      const collectorStats = await this.collector.getCollectionStats();

      return {
        database: dbStats,
        collector: collectorStats,
        service: {
          last_updated: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('[Service] Statistics retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Search notices by criteria
   */
  async searchNotices(criteria: {
    keyword?: string;
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }) {
    // This would implement search functionality
    // For now, return empty results
    console.log('[Service] Search functionality not yet implemented');
    return {
      notices: [],
      total_count: 0,
      search_criteria: criteria
    };
  }

  /**
   * Get notice by ID
   */
  async getNoticeById(id: number): Promise<BidNotice | null> {
    // This would implement single notice retrieval
    // For now, return null
    console.log(`[Service] Get notice by ID (${id}) not yet implemented`);
    return null;
  }

  /**
   * Update notice category manually
   */
  async updateNoticeCategory(id: number, category: string): Promise<boolean> {
    // This would implement manual category update
    // For now, return false
    console.log(`[Service] Update notice category (ID: ${id}, Category: ${category}) not yet implemented`);
    return false;
  }

  /**
   * Reprocess notices with keyword matching
   */
  async reprocessKeywordMatching(limit: number = 100): Promise<number> {
    try {
      console.log(`[Service] Reprocessing keyword matching for up to ${limit} notices...`);
      const processed = await this.databaseManager.applyKeywordMatching(limit);
      console.log(`[Service] Reprocessing completed: ${processed} notices processed`);
      return processed;
    } catch (error: any) {
      console.error('[Service] Reprocessing failed:', error.message);
      throw error;
    }
  }

  /**
   * Get processing queue status
   */
  async getProcessingStatus() {
    try {
      const stats = await this.databaseManager.getStatistics();
      const unprocessedCount = stats.total_notices - stats.processed_notices;

      return {
        total_notices: stats.total_notices,
        processed_notices: stats.processed_notices,
        unprocessed_notices: unprocessedCount,
        matched_notices: stats.matched_notices,
        processing_rate: stats.total_notices > 0
          ? (stats.processed_notices / stats.total_notices * 100).toFixed(2) + '%'
          : '0%'
      };
    } catch (error: any) {
      console.error('[Service] Processing status retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Close service and cleanup resources
   */
  async close(): Promise<void> {
    try {
      await this.databaseManager.close();
      this.collector.cleanup();
      console.log('[Service] Service closed successfully');
    } catch (error: any) {
      console.error('[Service] Service close failed:', error.message);
      throw error;
    }
  }
}

/**
 * Test service functionality
 */
export async function testService(): Promise<void> {
  const config: ServiceConfig = {
    serviceKey: process.env.DATA_GO_KR_SERVICE_KEY || '',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'test'
  };

  if (!config.serviceKey) {
    console.error('[Service Test] Error: DATA_GO_KR_SERVICE_KEY not found in environment variables');
    return;
  }

  const service = new BidNoticeService(config);

  try {
    console.log('=== Service Test ===');

    // Initialize service
    console.log('Initializing service...');
    await service.initialize(true); // Drop existing tables for test

    // Test daily collection
    console.log('Testing daily collection...');
    const result = await service.collectTodayNotices({
      saveToDatabase: true,
      applyKeywordMatching: true
    });

    console.log('\n=== Collection Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Duration: ${result.duration_ms}ms`);
    console.log(`Collection: ${JSON.stringify(result.collection_result, null, 2)}`);

    if (result.database_result) {
      console.log(`Database: ${JSON.stringify(result.database_result, null, 2)}`);
    }

    if (result.keyword_processing) {
      console.log(`Keyword Processing: ${JSON.stringify(result.keyword_processing, null, 2)}`);
    }

    if (result.errors.length > 0) {
      console.log('\n=== Errors ===');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Get statistics
    console.log('\n=== Statistics ===');
    const stats = await service.getStatistics();
    console.log(JSON.stringify(stats, null, 2));

    // Get processing status
    console.log('\n=== Processing Status ===');
    const status = await service.getProcessingStatus();
    console.log(JSON.stringify(status, null, 2));

  } catch (error: any) {
    console.error(`[Service Test] Test failed: ${error.message}`);
  } finally {
    await service.close();
  }
}