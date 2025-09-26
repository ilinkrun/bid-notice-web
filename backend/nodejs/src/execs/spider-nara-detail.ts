#!/usr/bin/env tsx

// NARA bid notice detail spider - Independent NARA detail spider
import 'dotenv/config';
import { program } from 'commander';

program
  .version('1.0.0')
  .description('NARA bid notice detail spider (나라장터 입찰공고 상세정보 수집기)')
  .option('-id, --notice-id <id>', 'Specific notice ID to process')
  .option('-l, --limit <number>', 'Limit number of items to process', '10')
  .option('--dry-run', 'Dry run mode (no database writes)', false)
  .option('--debug', 'Enable debug mode', false);

program.parse();

const options = program.opts();

async function main() {
  console.log(`Starting NARA detail spider with options:`, options);
  console.log('Processing NARA notice details...');

  try {
    // Import NARA detail collector dynamically
    const { collectNaraNoticeDetails } = await import('@/utils/nara/simple-collector');

    const result = await collectNaraNoticeDetails({
      noticeId: options.noticeId,
      limit: parseInt(options.limit),
      dryRun: options.dryRun,
      debug: options.debug
    });

    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Processed: ${result.processed}`);

    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
  } catch (error) {
    console.error('NARA detail spider failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('NARA detail spider completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('NARA detail spider failed:', error);
    process.exit(1);
  });