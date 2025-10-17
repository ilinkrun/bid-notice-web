#!/usr/bin/env node
/**
 * Cron job script to fetch bid notices from all active organizations
 * Runs twice daily at 11am and 11pm
 */

import { createMySQLPool, findOrgNames, fetchListPages } from '../utils/spiderGovBidList.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const config = require('../../env.config.js');

async function main() {
  console.log('='.repeat(100));
  console.log('Starting cron job: Fetch bid notices from all active organizations');
  console.log(`Execution time: ${new Date().toISOString()}`);
  console.log('='.repeat(100));

  try {
    // Initialize MySQL connection with config
    createMySQLPool(config.database);

    // Get all active organization names (use=1)
    const orgNames = await findOrgNames();

    if (orgNames.length === 0) {
      console.log('No active organizations found (use=1)');
      process.exit(0);
    }

    console.log(`Found ${orgNames.length} active organizations:`);
    orgNames.forEach((name, idx) => {
      console.log(`  ${idx + 1}. ${name}`);
    });
    console.log('='.repeat(100));

    // Fetch list pages for all organizations
    const result = await fetchListPages(orgNames, true);

    // Print summary
    console.log('='.repeat(100));
    console.log('Execution Summary:');
    console.log(`Total organizations processed: ${orgNames.length}`);
    console.log(`Organizations with errors: ${result.error_orgs.length}`);

    if (result.error_orgs.length > 0) {
      console.log('\nOrganizations with errors:');
      result.error_orgs.forEach((org: string) => {
        console.log(`  - ${org}`);
      });
    }

    // Calculate totals
    let totalScraped = 0;
    let totalNew = 0;
    let totalInserted = 0;

    result.logs.forEach((log: any) => {
      totalScraped += log.scraped_count || 0;
      totalNew += log.new_count || 0;
      totalInserted += log.inserted_count || 0;
    });

    console.log(`\nTotal scraped: ${totalScraped}`);
    console.log(`Total new notices: ${totalNew}`);
    console.log(`Total inserted: ${totalInserted}`);
    console.log('='.repeat(100));
    console.log('Cron job completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error executing cron job:', error);
    process.exit(1);
  }
}

// Execute main function
main();
