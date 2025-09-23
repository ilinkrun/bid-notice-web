/**
 * Main entry point for Korean Government Bid Notice API (Nara)
 * Exports all classes and functions for use in other applications
 */

// Core classes
export { DataGoKrApiClient } from './api-client.js';
export { BidNoticeParser } from './parser.js';
export { BidNoticeCollector, testCollector } from './collector.js';
export { DatabaseManager, testDatabase } from './database.js';
export { BidNoticeService, testService } from './service.js';

// Types and interfaces
export type {
  BidNotice,
  KeywordRule,
  ApiCollectionLog,
  KeywordMatch,
  CollectionResult
} from './models.js';

export type {
  ApiRequestParams,
  ApiResponse,
  BidNoticeRawItem
} from './api-client.js';

export type {
  ParsedAttachment
} from './parser.js';

export type {
  DatabaseConfig,
  DatabaseStats
} from './database.js';

export type {
  ServiceConfig,
  CollectionOptions,
  ServiceResult
} from './service.js';

// Constants and schemas
export {
  CREATE_TABLES_SQL,
  DEFAULT_KEYWORD_RULES,
  CREATE_TABLES_ORDER
} from './models.js';

/**
 * Main function for CLI usage
 */
export async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case 'test-api':
      console.log('Testing API client...');
      const { testCollector } = await import('./collector.js');
      await testCollector();
      break;

    case 'test-database':
      console.log('Testing database...');
      const { testDatabase } = await import('./database.js');
      await testDatabase();
      break;

    case 'test-service':
      console.log('Testing service...');
      const { testService } = await import('./service.js');
      await testService();
      break;

    case 'collect-today':
      console.log('Collecting today\'s notices...');
      await collectTodayNotices();
      break;

    case 'collect-latest':
      console.log('Collecting latest notices (3 days)...');
      await collectLatestNotices();
      break;

    default:
      console.log(`
Korean Government Bid Notice API (Nara)

Usage:
  npm run dev test-api       - Test API client functionality
  npm run dev test-database  - Test database functionality
  npm run dev test-service   - Test complete service
  npm run dev collect-today  - Collect today's notices
  npm run dev collect-latest - Collect last 3 days of notices

Environment Variables Required:
  DATA_GO_KR_SERVICE_KEY - Korean government API service key
  MYSQL_HOST            - MySQL host
  MYSQL_PORT            - MySQL port
  MYSQL_USER            - MySQL username
  MYSQL_PASSWORD        - MySQL password
  MYSQL_DATABASE        - MySQL database name
      `);
  }
}

/**
 * Collect today's notices and save to database
 */
async function collectTodayNotices(): Promise<void> {
  const config = getServiceConfig();
  const service = new BidNoticeService(config);

  try {
    await service.initialize();
    const result = await service.collectTodayNotices({
      saveToDatabase: true,
      applyKeywordMatching: true
    });

    console.log('=== Collection Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Total: ${result.collection_result.total_count}`);
    console.log(`Collected: ${result.collection_result.collected_count}`);
    console.log(`New: ${result.collection_result.new_count}`);
    console.log(`Updated: ${result.collection_result.updated_count}`);
    console.log(`Errors: ${result.collection_result.error_count}`);

    if (result.keyword_processing) {
      console.log(`Keyword Processed: ${result.keyword_processing.processed}`);
    }

  } catch (error: any) {
    console.error('Collection failed:', error.message);
    process.exit(1);
  } finally {
    await service.close();
  }
}

/**
 * Collect latest notices (last 3 days) and save to database
 */
async function collectLatestNotices(): Promise<void> {
  const config = getServiceConfig();
  const service = new BidNoticeService(config);

  try {
    await service.initialize();
    const result = await service.collectLatestNotices(3, {
      saveToDatabase: true,
      applyKeywordMatching: true
    });

    console.log('=== Collection Results ===');
    console.log(`Success: ${result.success}`);
    console.log(`Total: ${result.collection_result.total_count}`);
    console.log(`Collected: ${result.collection_result.collected_count}`);
    console.log(`New: ${result.collection_result.new_count}`);
    console.log(`Updated: ${result.collection_result.updated_count}`);
    console.log(`Errors: ${result.collection_result.error_count}`);

    if (result.keyword_processing) {
      console.log(`Keyword Processed: ${result.keyword_processing.processed}`);
    }

  } catch (error: any) {
    console.error('Collection failed:', error.message);
    process.exit(1);
  } finally {
    await service.close();
  }
}

/**
 * Get service configuration from environment variables
 */
function getServiceConfig(): ServiceConfig {
  const config: ServiceConfig = {
    serviceKey: process.env.DATA_GO_KR_SERVICE_KEY || '',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bid_notice'
  };

  // Validate required configuration
  if (!config.serviceKey) {
    console.error('Error: DATA_GO_KR_SERVICE_KEY environment variable is required');
    process.exit(1);
  }

  if (!config.password) {
    console.error('Error: MYSQL_PASSWORD environment variable is required');
    process.exit(1);
  }

  return config;
}

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Application error:', error);
    process.exit(1);
  });
}

export { ServiceConfig } from './service.js';