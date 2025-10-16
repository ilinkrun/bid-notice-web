#!/usr/bin/env tsx

// Government bid notice spider - Independent GOV spider
import 'dotenv/config';
import { program } from 'commander';

program
  .version('1.0.0')
  .description('Government bid notice spider (관공서 공고 수집기)')
  .option('-o, --org-name <name>', 'Organization name to scrape')
  .option('-l, --limit <number>', 'Limit number of organizations', '10')
  .option('--dry-run', 'Dry run mode (no database writes)', false)
  .option('--debug', 'Enable debug mode', false);

program.parse();

const options = program.opts();

async function main() {
  console.log(`Starting GOV spider with options:`, options);
  console.log('Processing government notices...');

  try {
    // Import GOV collector dynamically
    const { collectGovNotices } = await import('@/utils/gov/collector-list');

    const result = await collectGovNotices({
      agencies: options.orgName ? [options.orgName] : undefined,
      limit: parseInt(options.limit),
      dryRun: options.dryRun,
      debug: options.debug
    });

    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Agencies: ${result.agencies}, Scraped: ${result.totalScraped}, Inserted: ${result.totalInserted}`);

    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
  } catch (error) {
    console.error('GOV spider failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('GOV spider completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('GOV spider failed:', error);
    process.exit(1);
  });