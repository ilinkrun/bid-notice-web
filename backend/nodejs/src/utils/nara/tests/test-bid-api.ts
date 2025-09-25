/**
 * Test script for Korean Government Bid Notice API
 * Equivalent to the Python test_bid_api.py
 */

import { config } from 'dotenv';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { DataGoKrApiClient, BidNoticeRawItem } from './api-client.js';
import { BidNoticeParser } from './parser.js';
import { BidNotice } from './models.js';

// Load environment variables
config();

/**
 * Load service key from environment
 */
function loadServiceKey(): string {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    console.error('Error: DATA_GO_KR_SERVICE_KEY not found in .env file');
    process.exit(1);
  }
  return serviceKey;
}

/**
 * Save API response to JSON file with timestamp
 */
async function saveResponseToFile(data: any): Promise<void> {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '_')
    .replace('T', '_')
    .slice(0, -5); // Remove milliseconds and Z

  const filename = `res_${timestamp}.json`;

  // Create responses directory if it doesn't exist
  const responsesDir = path.join(process.cwd(), 'responses');
  if (!existsSync(responsesDir)) {
    await mkdir(responsesDir, { recursive: true });
  }

  // Full file path
  const filePath = path.join(responsesDir, filename);

  try {
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Response saved to: ${filePath}`);
  } catch (error: any) {
    console.error(`Error saving response to file: ${error.message}`);
  }
}

/**
 * Convert camelCase to snake_case
 */
function camelToSnake(name: string): string {
  return name
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1_$2')
    .toLowerCase();
}

/**
 * Convert all dictionary keys from camelCase to snake_case
 */
function convertKeysToSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}

/**
 * Safe value string for MySQL queries
 */
function safeValStr(val: any): string {
  if (val === null || val === undefined) {
    return 'NULL';
  } else if (typeof val === 'string') {
    return "'" + val.replace(/'/g, "\\'").replace(/"/g, '\\"') + "'";
  } else {
    return String(val);
  }
}

/**
 * Save API response data to MySQL notices_g2b table
 */
async function saveToMysql(data: any): Promise<void> {
  let connection: mysql.Connection | null = null;

  try {
    // Create MySQL connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'test',
      charset: 'utf8mb4'
    });

    // Extract items from response
    let items: BidNoticeRawItem[] = [];

    if (data?.response?.body?.items) {
      if (Array.isArray(data.response.body.items)) {
        items = data.response.body.items;
      } else if (data.response.body.items.item) {
        items = Array.isArray(data.response.body.items.item)
          ? data.response.body.items.item
          : [data.response.body.items.item];
      }
    } else if (data?.body?.items) {
      items = Array.isArray(data.body.items) ? data.body.items : [data.body.items];
    } else if (Array.isArray(data)) {
      items = data;
    }

    if (!items || items.length === 0) {
      console.log('No items found in API response');
      return;
    }

    console.log(`Processing ${items.length} items...`);

    for (const item of items) {
      try {
        // Clean item (remove null/empty keys) - keep camelCase for g2b_notices table
        const cleanedItem: Record<string, any> = {};
        for (const [key, value] of Object.entries(item)) {
          // Remove null or empty keys
          if (key === null || key === undefined || key === '') {
            continue;
          }

          // Convert empty strings to null
          cleanedItem[key] = value === '' ? null : value;
        }

        // Add default values for new fields
        cleanedItem.category = cleanedItem.category || '무관';
        cleanedItem.is_selected = cleanedItem.is_selected || 0;

        // Generate INSERT query manually (for null value handling)
        const keys = Object.keys(cleanedItem);
        const values = Object.values(cleanedItem);

        const keysStr = keys.map(k => `\`${k}\``).join(', ');
        const valsStr = values.map(v => safeValStr(v)).join(', ');

        const sql = `INSERT IGNORE INTO g2b_notices (${keysStr}) VALUES (${valsStr})`;

        await connection.execute(sql);

        const bidNtceNo = cleanedItem.bidNtceNo || 'N/A';
        const bidNtceNm = cleanedItem.bidNtceNm || 'N/A';
        console.log(`Inserted: ${bidNtceNo} - ${bidNtceNm.substring(0, 50)}...`);

      } catch (error: any) {
        const bidNtceNo = item.bidNtceNo || 'N/A';
        console.error(`Error inserting item ${bidNtceNo}: ${error.message}`);
        continue;
      }
    }

    console.log('MySQL save completed');

  } catch (error: any) {
    console.error(`Error saving to MySQL: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Test getBidPblancListInfoServc API
 */
async function testBidPblancListInfoService(): Promise<any> {
  // Load service key
  const serviceKey = loadServiceKey();

  // Create API client
  const apiClient = new DataGoKrApiClient(serviceKey);

  // Calculate date range (last 3 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 3);

  // API parameters
  const params = {
    pageNo: 1,
    numOfRows: 10, // Get 10 records for testing
    type: 'json' as const,
    inqryDiv: '1', // 조회구분 (1: 공고일자)
    inqryBgnDt: startDate.toISOString().slice(0, 10).replace(/-/g, '') + '0000', // YYYYMMDD0000
    inqryEndDt: endDate.toISOString().slice(0, 10).replace(/-/g, '') + '0000'     // YYYYMMDD0000
  };

  console.log('=== 공공데이터포털 입찰공고 API 테스트 ===');
  console.log('Parameters:', JSON.stringify(params, null, 2));
  console.log();

  try {
    console.log('Making API request...');

    // Make API request
    const data = await apiClient.getBidPblancListInfoServc(params);

    console.log('=== API Response ===');
    console.log(`Retrieved ${data.length} items`);

    if (data.length > 0) {
      console.log('\n=== Sample Items ===');

      data.slice(0, 3).forEach((item, index) => {
        console.log(`\n--- Item ${index + 1} ---`);
        console.log(`입찰공고번호: ${item.bidNtceNo || 'N/A'}`);
        console.log(`입찰공고명: ${item.bidNtceNm || 'N/A'}`);
        console.log(`공고기관명: ${item.ntceInsttNm || 'N/A'}`);
        console.log(`수요기관명: ${item.dminsttNm || 'N/A'}`);
        console.log(`입찰공고일: ${item.bidNtceDt || 'N/A'}`);
        console.log(`입찰마감일시: ${item.bidClseDt || 'N/A'}`);
        console.log(`개찰일시: ${item.opengDt || 'N/A'}`);
        console.log(`예정가격: ${item.presmptPrce || 'N/A'}`);
      });
    }

    // Test parsing
    console.log('\n=== Testing Parser ===');
    if (data.length > 0) {
      const firstItem = data[0];
      const parsed = BidNoticeParser.parseBidNotice(firstItem);

      console.log('Parsed notice:');
      console.log(`ID: ${parsed.bid_notice_no}`);
      console.log(`Name: ${parsed.bid_notice_name}`);
      console.log(`Dept: ${parsed.dept_name}`);
      console.log(`Notice Date: ${parsed.notice_date?.toISOString()?.split('T')[0]}`);
      console.log(`Budget: ${parsed.budget_amount}`);
    }

    // Save response to file
    await saveResponseToFile(data);

    // Save to MySQL database
    console.log('\n=== Saving to MySQL ===');
    await saveToMysql({ response: { body: { items: data } } });

    return data;

  } catch (error: any) {
    console.error(`Request error: ${error.message}`);
    return null;
  }
}

/**
 * Test complete service integration
 */
async function testServiceIntegration(): Promise<void> {
  console.log('\n=== Testing Service Integration ===');

  const { BidNoticeService } = await import('./service.js');

  const config = {
    serviceKey: loadServiceKey(),
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'test'
  };

  const service = new BidNoticeService(config);

  try {
    // Test today's collection
    console.log('Testing today\'s collection...');
    const result = await service.collectTodayNotices({
      saveToDatabase: false, // Don't save to avoid table dependency
      applyKeywordMatching: false
    });

    console.log('Service result:');
    console.log(`Success: ${result.success}`);
    console.log(`Total: ${result.collection_result.total_count}`);
    console.log(`Collected: ${result.collection_result.collected_count}`);
    console.log(`Errors: ${result.collection_result.error_count}`);

  } catch (error: any) {
    console.error('Service test failed:', error.message);
  } finally {
    await service.close();
  }
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  const testType = process.argv[2];

  switch (testType) {
    case 'api':
      await testBidPblancListInfoService();
      break;
    case 'service':
      await testServiceIntegration();
      break;
    default:
      console.log('Testing API client...');
      await testBidPblancListInfoService();

      console.log('\nTesting service integration...');
      await testServiceIntegration();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { testBidPblancListInfoService, testServiceIntegration };