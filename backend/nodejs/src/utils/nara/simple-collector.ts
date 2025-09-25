// NARA (나라장터) notice collector - Enhanced version
import { createLogger } from '@/utils/scraping-utils';
import { EnhancedBidNoticeCollector } from './enhanced-collector';

const logger = createLogger('nara-collector');

export interface NaraCollectionOptions {
  limit?: number;
  dryRun?: boolean;
  debug?: boolean;
  regions?: string[];
  categories?: string[];
}

export interface NaraCollectionResult {
  success: boolean;
  totalScraped: number;
  totalInserted: number;
  totalPages: number;
  errors: string[];
}

/**
 * Collect NARA notices using API client
 */
export async function collectNaraNotices(options: NaraCollectionOptions = {}): Promise<NaraCollectionResult> {
  const {
    limit = 100,
    dryRun = false,
    debug = false,
    regions = [],
    categories = []
  } = options;

  logger.info(`Starting NARA notice collection with limit: ${limit}, dryRun: ${dryRun}`);

  // Get service key from environment variables
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    if (dryRun) {
      logger.info('DRY RUN MODE: Using mock data (no API key required)');
      return {
        success: true,
        totalScraped: Math.min(limit, 50),
        totalInserted: Math.min(limit, 50),
        totalPages: Math.ceil(Math.min(limit, 50) / 20),
        errors: []
      };
    } else {
      logger.error('DATA_GO_KR_SERVICE_KEY environment variable is required');
      return {
        success: false,
        totalScraped: 0,
        totalInserted: 0,
        totalPages: 0,
        errors: ['Missing DATA_GO_KR_SERVICE_KEY environment variable']
      };
    }
  }

  const collector = new EnhancedBidNoticeCollector(serviceKey);

  try {
    const { result, notices } = await collector.collectDailyNotices({
      limit,
      dryRun,
      debug,
      areaCode: regions.length > 0 ? regions[0] : undefined,
      // Map categories to bidKind if needed
      bidKind: categories.length > 0 ? categories[0] : undefined
    });

    const success = result.error_count === 0 || result.error_count < result.total_count / 2;

    logger.info(`NARA collection completed: Total ${result.total_count}, Collected ${result.collected_count}, New ${result.new_count}, Errors: ${result.error_count}`);

    return {
      success,
      totalScraped: result.collected_count,
      totalInserted: result.new_count,
      totalPages: Math.ceil(result.collected_count / 100), // Estimate pages
      errors: result.errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`NARA collection failed: ${errorMessage}`);

    return {
      success: false,
      totalScraped,
      totalInserted,
      totalPages,
      errors: [...errors, errorMessage]
    };
  }
}

/**
 * Collect specific NARA notice details by ID
 */
export async function collectNaraNoticeDetails(options: {
  noticeId?: string;
  limit?: number;
  dryRun?: boolean;
  debug?: boolean;
}): Promise<{
  success: boolean;
  processed: number;
  errors: string[];
}> {
  const { noticeId, limit = 10, dryRun = false, debug = false } = options;

  logger.info(`Collecting NARA notice details${noticeId ? ` for ID: ${noticeId}` : ` (limit: ${limit})`}`);

  if (dryRun) {
    logger.info('DRY RUN MODE: No data will be saved');
    return {
      success: true,
      processed: noticeId ? 1 : limit,
      errors: []
    };
  }

  // Get service key from environment variables
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    if (dryRun) {
      logger.info('DRY RUN MODE: Using mock data (no API key required)');
      return {
        success: true,
        processed: noticeId ? 1 : limit,
        errors: []
      };
    } else {
      logger.error('DATA_GO_KR_SERVICE_KEY environment variable is required');
      return {
        success: false,
        processed: 0,
        errors: ['Missing DATA_GO_KR_SERVICE_KEY environment variable']
      };
    }
  }

  const collector = new EnhancedBidNoticeCollector(serviceKey);
  const errors: string[] = [];
  let processed = 0;

  try {
    if (noticeId) {
      // Process specific notice
      logger.info(`TODO: Implement specific notice detail collection for ${noticeId}`);
      // For now, mark as processed
      processed = 1;
      if (debug) {
        logger.debug(`Mock: Retrieved details for notice: ${noticeId}`);
      }
    } else {
      // Process recent notices for detail collection
      logger.info(`TODO: Process ${limit} recent notices for detail collection`);
      processed = limit; // Mock for now
    }

    return {
      success: errors.length === 0,
      processed,
      errors
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`NARA detail collection failed: ${errorMessage}`);

    return {
      success: false,
      processed,
      errors: [...errors, errorMessage]
    };
  }
}

/**
 * Save notices to database (placeholder implementation)
 */
async function saveNoticesToDatabase(notices: any[], debug: boolean): Promise<number> {
  // TODO: Implement actual database saving
  if (debug) {
    logger.debug(`TODO: Save ${notices.length} notices to database`);
  }

  // Mock successful insertion
  return notices.length;
}