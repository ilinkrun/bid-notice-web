#!/usr/bin/env tsx

/**
 * Manual test for GOV scraping functions
 * Test the getScrapingSettings and scrapeListBySettings functions directly
 */

import 'dotenv/config';
import { getScrapingSettings, scrapeListBySettings } from '@/utils/gov/collector-list';

async function main() {
  console.log('Testing GOV scraping functions...\n');

  try {
    // Test getScrapingSettings function
    console.log('Testing getScrapingSettings("광진구")...');
    const settings = await getScrapingSettings("광진구");

    console.log('Settings result:');
    console.log(JSON.stringify(settings, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');

    if (!settings) {
      console.log('No settings found for 광진구');
      return;
    }

    // Test scrapeListBySettings function
    console.log('Testing scrapeListBySettings with retrieved settings...');
    const result = await scrapeListBySettings(settings, true); // debug mode enabled

    console.log('Scraping result:');
    console.log('- org_name:', result.org_name);
    console.log('- error_code:', result.error_code);
    console.log('- error_message:', result.error_message);
    console.log('- data count:', result.data?.length || 0);

    if (result.data && result.data.length > 0) {
      console.log('\nFirst few scraped items:');
      result.data.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}.`, {
          title: item.title?.substring(0, 50) + '...',
          detail_url: item.detail_url,
          posted_date: item.posted_date,
          posted_by: item.posted_by
        });
      });
    }

    console.log('\nTest completed successfully!');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
main()
  .then(() => {
    console.log('All tests finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });