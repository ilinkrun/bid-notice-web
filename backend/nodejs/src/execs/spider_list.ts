#!/usr/bin/env tsx

// 관공서 및 나라장터 공고 목록을 수집하는 스크립트
import 'dotenv/config';
import { program } from 'commander';

program
  .version('1.0.0')
  .description('Bid notice list spider')
  .option('-s, --source <type>', 'Source type (gov|nara)', 'gov')
  .option('-l, --limit <number>', 'Limit number of items', '10')
  .option('--dry-run', 'Dry run mode (no database writes)', false);

program.parse();

const options = program.opts();

async function main() {
  console.log(`Starting spider_list with options:`, options);

  if (options.source === 'gov') {
    console.log('Processing government notices...');
    const { collectGovNotices } = await import('@/utils/gov/collector');
    const result = await collectGovNotices({
      limit: parseInt(options.limit),
      dryRun: options.dryRun,
      debug: true
    });

    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Agencies: ${result.agencies}, Scraped: ${result.totalScraped}, Inserted: ${result.totalInserted}`);
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
  } else if (options.source === 'nara') {
    console.log('Processing NARA notices...');
    const { collectNaraNotices } = await import('@/utils/nara/simple-collector');
    const result = await collectNaraNotices({
      limit: parseInt(options.limit),
      dryRun: options.dryRun,
      debug: true
    });

    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Pages: ${result.totalPages}, Scraped: ${result.totalScraped}, Inserted: ${result.totalInserted}`);
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
  } else {
    console.error('Invalid source type. Use --help for more information.');
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('Spider list completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Spider list failed:', error);
    process.exit(1);
  });