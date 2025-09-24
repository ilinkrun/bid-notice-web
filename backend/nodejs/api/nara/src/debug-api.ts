/**
 * Debug script to examine actual API response structure
 */

import { DataGoKrApiClient, ApiRequestParams } from './api-client.js';
import fs from 'fs';

async function debugApiResponse(): Promise<void> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  
  if (!serviceKey) {
    console.error('[Debug] Error: DATA_GO_KR_SERVICE_KEY not found in environment variables');
    return;
  }

  const client = new DataGoKrApiClient(serviceKey);

  // Try basic request without any filters
  const testParams: ApiRequestParams = {
    inqryDiv: '1',
    inqryBgnDt: '202409010000',  // September 2024
    inqryEndDt: '202409302359',   // End of September 2024
    numOfRows: 5,
    type: 'json'
  };

  try {
    console.log('=== API Response Debug ===');
    console.log('Test parameters:', JSON.stringify(testParams, null, 2));
    
    // Make direct API call to examine response
    const response = await client['httpClient'].get(
      `${client['baseUrl']}/getBidPblancListInfoServc`,
      {
        params: {
          serviceKey: client['serviceKey'],
          ...testParams
        }
      }
    );

    console.log('\n=== Raw API Response ===');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Data structure:');
    console.log(JSON.stringify(response.data, null, 2));

    // Save response to file for analysis
    fs.writeFileSync(
      '/exposed/projects/bid-notice-web/backend/nodejs/api/nara/responses/debug_raw_response.json',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        params: testParams,
        status: response.status,
        headers: response.headers,
        data: response.data
      }, null, 2)
    );

    console.log('\n=== Debug response saved to debug_raw_response.json ===');

  } catch (error: any) {
    console.error(`[Debug] Error: ${error.message}`);
    if (error.response) {
      console.error(`Response Status: ${error.response.status}`);
      console.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run debug
debugApiResponse()
  .then(() => {
    console.log('[Debug] Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Debug] Debug failed:', error.message);
    process.exit(1);
  });