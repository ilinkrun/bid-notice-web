/**
 * Test script to compare API requests with different regional constraints
 * Compares results between "no regional limitation" vs "Seoul only" filtering
 */

import { DataGoKrApiClient, ApiRequestParams } from './api-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function saveResponseToFile(data: any, filename: string): Promise<void> {
  const responsesDir = path.join(__dirname, '..', 'responses');
  
  // Ensure responses directory exists
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

async function testRegionalConstraints(): Promise<void> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  
  if (!serviceKey) {
    console.error('[Test] Error: DATA_GO_KR_SERVICE_KEY not found in environment variables');
    return;
  }

  const client = new DataGoKrApiClient(serviceKey);

  // Common parameters - using available data period for testing
  const baseParams: ApiRequestParams = {
    inqryDiv: '1',                    // 공고게시일시 기준
    inqryBgnDt: '202409010000',       // 2024-09-01 이후 (실제 데이터가 있는 기간)
    inqryEndDt: '202409302359',       // 2024-09-30까지
    numOfRows: 50,                    // 충분한 수로 테스트
    type: 'json'
    // bidNtceNm 제거 - 공고명 조건 없음
  };

  try {
    console.log('=== Regional Constraint Test ===');
    console.log('Common conditions:');
    console.log('- 공고게시일: 2024-09-01 ~ 2024-09-30 (테스트용)');
    console.log('- 업무구분: 일반용역, 기술용역');
    console.log('- 공고명 조건: 없음');
    console.log('');

    // Test 1: No regional limitation (지역제한 없음)
    // This means we don't specify prtcptLmtRgnCd parameter
    console.log('=== Test 1: No Regional Limitation ===');
    
    // Request for 일반용역
    console.log('[Test 1-1] Requesting 일반용역 with no regional limitation...');
    const noRegion_GeneralService = await client.getBidPblancListInfoServc({
      ...baseParams,
      srvceDivNm: '일반용역'
      // prtcptLmtRgnCd not specified = no regional limitation
    });
    
    // Request for 기술용역
    console.log('[Test 1-2] Requesting 기술용역 with no regional limitation...');
    const noRegion_TechnicalService = await client.getBidPblancListInfoServc({
      ...baseParams,
      srvceDivNm: '기술용역'
      // prtcptLmtRgnCd not specified = no regional limitation
    });

    // Combine results
    const noRegionResults = [...noRegion_GeneralService, ...noRegion_TechnicalService];
    await saveResponseToFile(noRegionResults, 'test1_no_regional_limitation.json');

    // Test 2: Seoul only (서울특별시만)
    console.log('=== Test 2: Seoul Only ===');
    
    // Request for 일반용역 in Seoul
    console.log('[Test 2-1] Requesting 일반용역 in Seoul...');
    const seoul_GeneralService = await client.getBidPblancListInfoServc({
      ...baseParams,
      srvceDivNm: '일반용역',
      prtcptLmtRgnCd: '11'  // 서울특별시
    });
    
    // Request for 기술용역 in Seoul
    console.log('[Test 2-2] Requesting 기술용역 in Seoul...');
    const seoul_TechnicalService = await client.getBidPblancListInfoServc({
      ...baseParams,
      srvceDivNm: '기술용역',
      prtcptLmtRgnCd: '11'  // 서울특별시
    });

    // Combine results
    const seoulResults = [...seoul_GeneralService, ...seoul_TechnicalService];
    await saveResponseToFile(seoulResults, 'test2_seoul_only.json');

    // Analysis
    console.log('');
    console.log('=== Analysis ===');
    console.log(`No Regional Limitation: ${noRegionResults.length} notices`);
    console.log(`Seoul Only: ${seoulResults.length} notices`);
    
    if (noRegionResults.length > 0) {
      console.log('\n=== Sample from No Regional Limitation ===');
      const sample1 = noRegionResults[0];
      console.log(`- bidNtceNo: ${sample1.bidNtceNo}`);
      console.log(`- bidNtceNm: ${sample1.bidNtceNm}`);
      console.log(`- prtcptLmtRgnNm: ${sample1.prtcptLmtRgnNm || 'N/A'}`);
      console.log(`- srvceDivNm: ${sample1.srvceDivNm || 'N/A'}`);
    }
    
    if (seoulResults.length > 0) {
      console.log('\n=== Sample from Seoul Only ===');
      const sample2 = seoulResults[0];
      console.log(`- bidNtceNo: ${sample2.bidNtceNo}`);
      console.log(`- bidNtceNm: ${sample2.bidNtceNm}`);
      console.log(`- prtcptLmtRgnNm: ${sample2.prtcptLmtRgnNm || 'N/A'}`);
      console.log(`- srvceDivNm: ${sample2.srvceDivNm || 'N/A'}`);
    }

    // Regional analysis for no-limitation results
    if (noRegionResults.length > 0) {
      console.log('\n=== Regional Distribution in No Limitation Results ===');
      const regionCount: Record<string, number> = {};
      
      noRegionResults.forEach(notice => {
        const region = notice.prtcptLmtRgnNm || '지역정보없음';
        regionCount[region] = (regionCount[region] || 0) + 1;
      });
      
      Object.entries(regionCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([region, count]) => {
          console.log(`  ${region}: ${count}건`);
        });
    }

    console.log('\n=== Test Completed ===');
    console.log('Results saved to responses directory');

  } catch (error: any) {
    console.error(`[Test] Error during test: ${error.message}`);
    if (error.response) {
      console.error(`Response Status: ${error.response.status}`);
      console.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run the test
testRegionalConstraints()
  .then(() => {
    console.log('[Test] Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[Test] Test failed:', error.message);
    process.exit(1);
  });