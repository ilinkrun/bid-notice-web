/**
 * Test regional name parameters (prtcptLmtRgnNm) instead of regional codes
 */

import { DataGoKrApiClient, ApiRequestParams } from './api-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function saveResponseToFile(data: any, filename: string): Promise<void> {
  const responsesDir = path.join(__dirname, '..', 'responses');
  
  if (!fs.existsSync(responsesDir)) {
    fs.mkdirSync(responsesDir, { recursive: true });
  }
  
  const filePath = path.join(responsesDir, filename);
  const content = {
    timestamp: new Date().toISOString(),
    total_count: data.length,
    data: data
  };
  
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`[Test] Saved ${data.length} items to ${filename}`);
}

async function testRegionNameParameters(): Promise<void> {
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
    numOfRows: 50,
    type: 'json',
    srvceDivNm: '일반용역'  // Focus on 일반용역 for clearer comparison
  };

  try {
    console.log('=== Regional Name Parameter Test ===');
    console.log('Testing prtcptLmtRgnNm parameter with different values');
    console.log('Common conditions:');
    console.log('- 공고게시일: 2024-09-01 ~ 2024-09-30');
    console.log('- 업무구분: 일반용역');
    console.log('');

    // Test 1: Seoul only
    console.log('[Test 1] 서울특별시...');
    const seoulResults = await client.getBidPblancListInfoServc({
      ...baseParams,
      prtcptLmtRgnNm: '서울특별시'
    });

    // Test 2: Nationwide (no restriction)
    console.log('[Test 2] 전국(제한없음)...');
    const nationwideResults = await client.getBidPblancListInfoServc({
      ...baseParams,
      prtcptLmtRgnNm: '전국(제한없음)'
    });

    // Test 3: No regional filter for comparison
    console.log('[Test 3] No regional filter (for comparison)...');
    const noFilterResults = await client.getBidPblancListInfoServc({
      ...baseParams
      // No prtcptLmtRgnNm parameter
    });

    console.log('\n=== Results Count ===');
    console.log(`서울특별시: ${seoulResults.length} notices`);
    console.log(`전국(제한없음): ${nationwideResults.length} notices`);
    console.log(`No filter: ${noFilterResults.length} notices`);

    // Save results
    await saveResponseToFile(seoulResults, 'test_region_seoul.json');
    await saveResponseToFile(nationwideResults, 'test_region_nationwide.json');
    await saveResponseToFile(noFilterResults, 'test_region_no_filter.json');

    // Compare first few notices
    console.log('\n=== First Notice Comparison ===');
    if (seoulResults.length > 0) {
      console.log(`서울 first: ${seoulResults[0]?.bidNtceNo} - ${seoulResults[0]?.bidNtceNm?.substring(0, 50)}...`);
    } else {
      console.log('서울: No results');
    }
    
    if (nationwideResults.length > 0) {
      console.log(`전국 first: ${nationwideResults[0]?.bidNtceNo} - ${nationwideResults[0]?.bidNtceNm?.substring(0, 50)}...`);
    } else {
      console.log('전국: No results');
    }
    
    if (noFilterResults.length > 0) {
      console.log(`No filter first: ${noFilterResults[0]?.bidNtceNo} - ${noFilterResults[0]?.bidNtceNm?.substring(0, 50)}...`);
    }

    // Check for overlaps
    const seoulIds = new Set(seoulResults.map(n => n.bidNtceNo));
    const nationwideIds = new Set(nationwideResults.map(n => n.bidNtceNo));
    const noFilterIds = new Set(noFilterResults.map(n => n.bidNtceNo));

    console.log('\n=== Overlap Analysis ===');
    console.log(`서울 ∩ 전국: ${seoulResults.filter(n => nationwideIds.has(n.bidNtceNo)).length} notices`);
    console.log(`서울 ∩ No filter: ${seoulResults.filter(n => noFilterIds.has(n.bidNtceNo)).length} notices`);
    console.log(`전국 ∩ No filter: ${nationwideResults.filter(n => noFilterIds.has(n.bidNtceNo)).length} notices`);

    // Analyze regional information in Seoul results
    if (seoulResults.length > 0) {
      console.log('\n=== 서울특별시 Results Analysis ===');
      seoulResults.slice(0, 5).forEach((notice, i) => {
        console.log(`${i + 1}. ${notice.bidNtceNm}`);
        console.log(`   공고기관: ${notice.ntceInsttNm || 'N/A'}`);
        console.log(`   수요기관: ${notice.dminsttNm || 'N/A'}`);
        console.log(`   지역제한: ${notice.prtcptLmtRgnNm || 'N/A'}`);
        console.log(`   지역판단기준: ${notice.rgnLmtBidLocplcJdgmBssNm || 'N/A'}`);
        console.log('');
      });
    }

    // Analyze regional information in nationwide results
    if (nationwideResults.length > 0) {
      console.log('\n=== 전국(제한없음) Results Analysis ===');
      nationwideResults.slice(0, 5).forEach((notice, i) => {
        console.log(`${i + 1}. ${notice.bidNtceNm}`);
        console.log(`   공고기관: ${notice.ntceInsttNm || 'N/A'}`);
        console.log(`   수요기관: ${notice.dminsttNm || 'N/A'}`);
        console.log(`   지역제한: ${notice.prtcptLmtRgnNm || 'N/A'}`);
        console.log(`   지역판단기준: ${notice.rgnLmtBidLocplcJdgmBssNm || 'N/A'}`);
        console.log('');
      });
    }

    console.log('\n=== Test Completed ===');
    console.log('Results saved to responses directory');

  } catch (error: any) {
    console.error(`[Test] Error: ${error.message}`);
    if (error.response) {
      console.error(`Response Status: ${error.response.status}`);
      console.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run test
testRegionNameParameters()
  .then(() => {
    console.log('[Test] Regional name parameter test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Test] Test failed:', error.message);
    process.exit(1);
  });