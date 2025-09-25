#!/usr/bin/env tsx

// Manual GOV scraping test script
import 'dotenv/config';
import { program } from 'commander';
import { ScrapingWorkflow } from '@/utils/scraping-workflow';
import { createLogger } from '@/utils/scraping-utils';
import type { ScrapingSettings } from '@/types/scraping';

const logger = createLogger('test-gov-scraping');

program
  .version('1.0.0')
  .description('Manual GOV scraping test')
  .option('-o, --org-name <name>', 'Organization name to test', '가평군청')
  .option('--dry-run', 'Dry run mode (no database writes)', false)
  .option('--debug', 'Enable debug mode', false);

program.parse();

const options = program.opts();

// Mock scraping settings for testing
const mockScrapingSettings: Record<string, ScrapingSettings> = {
  '가평군청': {
    oid: 1,
    org_name: '가평군청',
    url: 'https://httpbin.org/html',  // Test URL for demo
    rowXpath: '//h1',
    startPage: 1,
    endPage: 1,
    use: 1,
    elements: JSON.stringify({
      title: { xpath: '//h1' },
      detail_url: { xpath: '//h1' },
      posted_date: { xpath: '//h1' },
      posted_by: { xpath: '//h1' }
    })
  },
  '한국공항공사': {
    oid: 2,
    org_name: '한국공항공사',
    url: 'https://example.com/',  // Test URL for demo
    rowXpath: '//h1',
    startPage: 1,
    endPage: 1,
    use: 1,
    elements: JSON.stringify({
      title: { xpath: '//h1' },
      detail_url: { xpath: '//h1' },
      posted_date: { xpath: '//h1' },
      posted_by: { xpath: '//h1' }
    })
  }
};

async function testSingleAgency(orgName: string, debug: boolean, dryRun: boolean) {
  logger.info(`=`.repeat(60));
  logger.info(`Testing: ${orgName}`);
  logger.info(`Debug: ${debug}, Dry Run: ${dryRun}`);
  logger.info(`=`.repeat(60));

  // Get mock settings
  const settings = mockScrapingSettings[orgName];
  if (!settings) {
    logger.error(`No settings found for: ${orgName}`);
    logger.info(`Available orgs: ${Object.keys(mockScrapingSettings).join(', ')}`);
    return;
  }

  const workflow = new ScrapingWorkflow();

  try {
    await workflow.initialize();

    logger.info(`Settings for ${orgName}:`);
    logger.info(`  URL: ${settings.url}`);
    logger.info(`  Pages: ${settings.startPage} - ${settings.endPage}`);
    logger.info(`  Row XPath: ${settings.rowXpath}`);

    // Test scraping
    const result = await workflow.scrapeBySettings(settings, debug);

    logger.info(`\n📊 Scraping Results:`);
    logger.info(`  Error Code: ${result.error_code}`);
    logger.info(`  Error Message: ${result.error_message || 'None'}`);
    logger.info(`  Total Notices: ${result.data.length}`);

    if (result.data.length > 0) {
      logger.info(`\n📝 Sample Notices (first 3):`);
      result.data.slice(0, 3).forEach((notice, index) => {
        logger.info(`  ${index + 1}. ${notice.title}`);
        logger.info(`     Date: ${notice.posted_date}`);
        logger.info(`     URL: ${notice.detail_url}`);
        logger.info(`     By: ${notice.posted_by || 'N/A'}`);
        logger.info('');
      });
    }

    // Show all notices if in debug mode
    if (debug && result.data.length > 3) {
      logger.info(`\n🔍 All Notices:`);
      result.data.forEach((notice, index) => {
        logger.info(`  ${index + 1}. ${notice.title} (${notice.posted_date})`);
      });
    }

    if (dryRun) {
      logger.info(`\n🔄 DRY RUN MODE - No data saved to database`);
    } else {
      logger.info(`\n💾 TODO: Save ${result.data.length} notices to database`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Test failed: ${errorMessage}`);
  } finally {
    await workflow.cleanup();
  }
}

async function main() {
  const { orgName, dryRun, debug } = options;

  logger.info(`Starting manual GOV scraping test`);
  logger.info(`Organization: ${orgName}`);

  await testSingleAgency(orgName, debug, dryRun);

  logger.info(`\n✅ Test completed`);
}

main()
  .then(() => {
    console.log('Manual test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Manual test failed:', error);
    process.exit(1);
  });