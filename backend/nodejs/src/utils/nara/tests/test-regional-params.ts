/**
 * Test if regional parameters actually work by using different region codes
 */

import { DataGoKrApiClient, ApiRequestParams } from './api-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRegionalParameters(): Promise<void> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  
  if (!serviceKey) {
    console.error('[Test] Error: DATA_GO_KR_SERVICE_KEY not found in environment variables');
    return;
  }

  const client = new DataGoKrApiClient(serviceKey);

  // Base parameters
  const baseParams: ApiRequestParams = {
    inqryDiv: '1',
    inqryBgnDt: '202409010000',
    inqryEndDt: '202409302359',
    numOfRows: 20,
    type: 'json'
  };

  try {
    console.log('=== Regional Parameter Test ===');
    console.log('Testing different regional codes to see if they produce different results');
    console.log('');

    // Test 1: No regional filter
    console.log('[Test 1] No regional filter...');
    const noRegionResults = await client.getBidPblancListInfoServc({
      ...baseParams
    });

    // Test 2: Seoul (11)
    console.log('[Test 2] Seoul only (code: 11)...');
    const seoulResults = await client.getBidPblancListInfoServc({
      ...baseParams,
      prtcptLmtRgnCd: '11'
    });

    // Test 3: Busan (26)
    console.log('[Test 3] Busan only (code: 26)...');
    const busanResults = await client.getBidPblancListInfoServc({
      ...baseParams,
      prtcptLmtRgnCd: '26'
    });

    // Test 4: Gyeonggi (41)
    console.log('[Test 4] Gyeonggi only (code: 41)...');
    const gyeonggiResults = await client.getBidPblancListInfoServc({
      ...baseParams,
      prtcptLmtRgnCd: '41'
    });

    console.log('\n=== Results Count ===');
    console.log(`No filter: ${noRegionResults.length} notices`);
    console.log(`Seoul (11): ${seoulResults.length} notices`);
    console.log(`Busan (26): ${busanResults.length} notices`);
    console.log(`Gyeonggi (41): ${gyeonggiResults.length} notices`);

    // Compare first notice IDs to see if they're different
    console.log('\n=== First Notice Comparison ===');
    if (noRegionResults.length > 0) {
      console.log(`No filter first: ${noRegionResults[0]?.bidNtceNo} - ${noRegionResults[0]?.bidNtceNm?.substring(0, 50)}...`);
    }
    if (seoulResults.length > 0) {
      console.log(`Seoul first: ${seoulResults[0]?.bidNtceNo} - ${seoulResults[0]?.bidNtceNm?.substring(0, 50)}...`);
    }
    if (busanResults.length > 0) {
      console.log(`Busan first: ${busanResults[0]?.bidNtceNo} - ${busanResults[0]?.bidNtceNm?.substring(0, 50)}...`);
    }
    if (gyeonggiResults.length > 0) {
      console.log(`Gyeonggi first: ${gyeonggiResults[0]?.bidNtceNo} - ${gyeonggiResults[0]?.bidNtceNm?.substring(0, 50)}...`);
    }

    // Check for overlaps
    const noRegionIds = new Set(noRegionResults.map(n => n.bidNtceNo));
    const seoulIds = new Set(seoulResults.map(n => n.bidNtceNo));
    const busanIds = new Set(busanResults.map(n => n.bidNtceNo));
    const gyeonggiIds = new Set(gyeonggiResults.map(n => n.bidNtceNo));

    console.log('\n=== Overlap Analysis ===');
    console.log(`Seoul ∩ No filter: ${seoulResults.filter(n => noRegionIds.has(n.bidNtceNo)).length} notices`);
    console.log(`Busan ∩ No filter: ${busanResults.filter(n => noRegionIds.has(n.bidNtceNo)).length} notices`);
    console.log(`Gyeonggi ∩ No filter: ${gyeonggiResults.filter(n => noRegionIds.has(n.bidNtceNo)).length} notices`);
    console.log(`Seoul ∩ Busan: ${seoulResults.filter(n => busanIds.has(n.bidNtceNo)).length} notices`);
    console.log(`Seoul ∩ Gyeonggi: ${seoulResults.filter(n => gyeonggiIds.has(n.bidNtceNo)).length} notices`);
    console.log(`Busan ∩ Gyeonggi: ${busanResults.filter(n => gyeonggiIds.has(n.bidNtceNo)).length} notices`);

    // Analyze regional data in results
    if (seoulResults.length > 0) {
      console.log('\n=== Seoul Results Analysis ===');
      seoulResults.slice(0, 5).forEach((notice, i) => {
        console.log(`${i + 1}. ${notice.bidNtceNm}`);
        console.log(`   기관: ${notice.ntceInsttNm || 'N/A'}`);
        console.log(`   수요기관: ${notice.dminsttNm || 'N/A'}`);
        console.log(`   지역제한: ${notice.rgnLmtBidLocplcJdgmBssNm || 'N/A'}`);
      });
    }

    // Save results for detailed analysis
    const responsesDir = path.join(__dirname, '..', 'responses');
    const results = {
      timestamp: new Date().toISOString(),
      test_results: {
        no_filter: { count: noRegionResults.length, data: noRegionResults },
        seoul: { count: seoulResults.length, data: seoulResults },
        busan: { count: busanResults.length, data: busanResults },
        gyeonggi: { count: gyeonggiResults.length, data: gyeonggiResults }
      }
    };

    fs.writeFileSync(
      path.join(responsesDir, 'regional_parameter_test.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('\n=== Test Completed ===');
    console.log('Detailed results saved to regional_parameter_test.json');

  } catch (error: any) {
    console.error(`[Test] Error: ${error.message}`);
    if (error.response) {
      console.error(`Response Status: ${error.response.status}`);
      console.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run test
testRegionalParameters()
  .then(() => {
    console.log('[Test] Regional parameter test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Test] Test failed:', error.message);
    process.exit(1);
  });