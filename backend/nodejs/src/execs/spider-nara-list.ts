#!/usr/bin/env tsx

// NARA bid notice spider - Independent NARA spider
import 'dotenv/config';
import { program } from 'commander';

program
  .version('1.0.0')
  .description('NARA bid notice spider (나라장터 입찰공고 수집기)')
  .option('-l, --limit <number>', 'Limit number of items to collect', '100')
  .option('-d, --days <number>', 'Number of days to look back', '7')
  .option('--area <code>', 'Area/region code filter')
  .option('--org <name>', 'Organization name filter')
  .option('--dry-run', 'Dry run mode (no database writes)', false)
  .option('--debug', 'Enable debug mode', false);

program.parse();

const options = program.opts();

async function main() {
  console.log(`Starting NARA spider with options:`, options);
  console.log('Processing NARA notices...');

  try {
    // Import NARA collector dynamically
    const { collectNaraNotices } = await import('@/utils/nara/simple-collector');

    const result = await collectNaraNotices({
      limit: parseInt(options.limit),
      regions: options.area ? [options.area] : undefined,
      dryRun: options.dryRun,
      debug: options.debug
    });

    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Pages: ${result.totalPages}, Scraped: ${result.totalScraped}, Inserted: ${result.totalInserted}`);

    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
  } catch (error) {
    console.error('NARA spider failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('NARA spider completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('NARA spider failed:', error);
    process.exit(1);
  });