/**
 * Test the search endpoint with regional filtering using browser test conditions
 */

import { DataGoKrApiClient, ApiRequestParams } from './api-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSearchEndpoint(): Promise<void> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  
  if (!serviceKey) {
    console.error('[Test] Error: DATA_GO_KR_SERVICE_KEY not found in environment variables');
    return;
  }

  const client = new DataGoKrApiClient(serviceKey);

  // Base parameters matching browser test
  const baseParams: ApiRequestParams = {
    inqryDiv: '1',
    inqryBgnDt: '202509010000',
    inqryEndDt: '202509230000',
    bidNtceNm: '내진성능평가',
    numOfRows: 10,
    type: 'json'
  };

  try {
    console.log('=== Search Endpoint Regional Test ===');
    console.log('Testing with search endpoint (getBidPblancListInfoServcPPSSrch)');
    console.log('Conditions matching browser test:');
    console.log('- 공고게시일: 2025-09-01 ~ 2025-09-23');
    console.log('- 공고명 포함: 내진성능평가');
    console.log('');

    // Test 1: No regional filter (should get totalCount 123)
    console.log('[Test 1] No regional filter...');
    const noFilterResults = await client.getBidPblancListInfoServc({
      ...baseParams
    });

    // Test 2: Seoul only (should get totalCount 1)
    console.log('[Test 2] 서울특별시...');
    const seoulResults = await client.getBidPblancListInfoServc({
      ...baseParams,
      prtcptLmtRgnNm: '서울특별시'
    });

    // Test 3: Nationwide (should get totalCount 4)
    console.log('[Test 3] 전국...');
    const nationwideResults = await client.getBidPblancListInfoServc({
      ...baseParams,
      prtcptLmtRgnNm: '전국'
    });

    console.log('\n=== Results Count ===');
    console.log(`No filter: ${noFilterResults.length} notices`);
    console.log(`서울특별시: ${seoulResults.length} notices`);
    console.log(`전국: ${nationwideResults.length} notices`);

    console.log('\n=== Expected vs Actual ===');
    console.log(`No filter - Expected: ~123, Actual: ${noFilterResults.length}`);
    console.log(`서울특별시 - Expected: 1, Actual: ${seoulResults.length}`);
    console.log(`전국 - Expected: 4, Actual: ${nationwideResults.length}`);

    // Compare first notices
    console.log('\n=== First Notice Comparison ===');
    if (noFilterResults.length > 0) {
      console.log(`No filter: ${noFilterResults[0]?.bidNtceNo} - ${noFilterResults[0]?.bidNtceNm}`);
    }
    if (seoulResults.length > 0) {
      console.log(`서울: ${seoulResults[0]?.bidNtceNo} - ${seoulResults[0]?.bidNtceNm}`);
    }
    if (nationwideResults.length > 0) {
      console.log(`전국: ${nationwideResults[0]?.bidNtceNo} - ${nationwideResults[0]?.bidNtceNm}`);
    }

    // Check for overlaps
    const noFilterIds = new Set(noFilterResults.map(n => n.bidNtceNo));
    const seoulIds = new Set(seoulResults.map(n => n.bidNtceNo));
    const nationwideIds = new Set(nationwideResults.map(n => n.bidNtceNo));

    console.log('\n=== Overlap Analysis ===');
    console.log(`서울 ∩ No filter: ${seoulResults.filter(n => noFilterIds.has(n.bidNtceNo)).length} notices`);
    console.log(`전국 ∩ No filter: ${nationwideResults.filter(n => noFilterIds.has(n.bidNtceNo)).length} notices`);
    console.log(`서울 ∩ 전국: ${seoulResults.filter(n => nationwideIds.has(n.bidNtceNo)).length} notices`);

    // Analyze Seoul results
    if (seoulResults.length > 0) {
      console.log('\n=== 서울특별시 Results Analysis ===');
      seoulResults.forEach((notice, i) => {
        console.log(`${i + 1}. ${notice.bidNtceNm}`);
        console.log(`   공고기관: ${notice.ntceInsttNm || 'N/A'}`);
        console.log(`   수요기관: ${notice.dminsttNm || 'N/A'}`);
        console.log(`   지역제한: ${notice.prtcptLmtRgnNm || 'N/A'}`);
        console.log('');
      });
    }

    // Save results
    const responsesDir = path.join(__dirname, '..', 'responses');
    const results = {
      timestamp: new Date().toISOString(),
      endpoint: 'getBidPblancListInfoServcPPSSrch',
      test_conditions: baseParams,
      results: {
        no_filter: { count: noFilterResults.length, data: noFilterResults },
        seoul: { count: seoulResults.length, data: seoulResults },
        nationwide: { count: nationwideResults.length, data: nationwideResults }
      }
    };

    fs.writeFileSync(
      path.join(responsesDir, 'search_endpoint_test.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('\n=== Test Completed ===');
    console.log('Results saved to search_endpoint_test.json');

  } catch (error: any) {
    console.error(`[Test] Error: ${error.message}`);
    if (error.response) {
      console.error(`Response Status: ${error.response.status}`);
      console.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run test
testSearchEndpoint()
  .then(() => {
    console.log('[Test] Search endpoint test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Test] Test failed:', error.message);
    process.exit(1);
  });