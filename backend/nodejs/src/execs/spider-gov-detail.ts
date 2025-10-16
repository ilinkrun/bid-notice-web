#!/usr/bin/env tsx

// Government bid notice detail spider - Based on Python spider_detail.py
import 'dotenv/config';
import { program } from 'commander';

program
  .version('1.0.0')
  .description('Government bid notice detail spider (관공서 공고 상세정보 수집기)')
  .option('-o, --org-name <name>', 'Organization name to process')
  .option('-id, --notice-id <id>', 'Specific notice ID to process')
  .option('-l, --limit <number>', 'Limit number of items to process', '10')
  .option('--dry-run', 'Dry run mode (no database writes)', false)
  .option('--debug', 'Enable debug mode', false);

program.parse();

const options = program.opts();

async function main() {
  console.log(`Starting GOV detail spider with options:`, options);
  console.log('Processing government notice details...');

  try {
    // Import GOV detail collector dynamically
    const { collectGovNoticeDetails } = await import('@/utils/gov/detail-collector');

    const result = await collectGovNoticeDetails({
      orgName: options.orgName,
      noticeId: options.noticeId,
      limit: parseInt(options.limit),
      dryRun: options.dryRun,
      debug: options.debug
    });

    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Processed: ${result.processed}, Updated: ${result.updated}`);

    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
  } catch (error) {
    console.error('GOV detail spider failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('GOV detail spider completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('GOV detail spider failed:', error);
    process.exit(1);
  });