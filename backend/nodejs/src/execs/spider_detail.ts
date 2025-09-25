#!/usr/bin/env tsx

// 관공서 및 나라장터 공고 상세 정보를 수집하는 스크립트
import 'dotenv/config';
import { program } from 'commander';

program
  .version('1.0.0')
  .description('Bid notice detail spider')
  .option('-s, --source <type>', 'Source type (gov|nara)', 'gov')
  .option('-id, --notice-id <id>', 'Specific notice ID to process')
  .option('-l, --limit <number>', 'Limit number of items', '10')
  .option('--dry-run', 'Dry run mode (no database writes)', false);

program.parse();

const options = program.opts();

async function main() {
  console.log(`Starting spider_detail with options:`, options);

  if (options.source === 'gov') {
    console.log('Processing government notice details...');
    console.log('GOV detail collection not yet implemented');
    // TODO: Implement government notice detail collection
  } else if (options.source === 'nara') {
    console.log('Processing NARA notice details...');
    const { collectNaraNoticeDetails } = await import('@/utils/nara/simple-collector');
    const result = await collectNaraNoticeDetails({
      noticeId: options.noticeId,
      limit: parseInt(options.limit),
      dryRun: options.dryRun,
      debug: true
    });

    console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Processed: ${result.processed}`);
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
    console.log('Spider detail completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Spider detail failed:', error);
    process.exit(1);
  });