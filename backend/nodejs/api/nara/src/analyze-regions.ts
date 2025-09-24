/**
 * Analyze regional data in saved responses
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeRegionalData(): void {
  const responsesDir = path.join(__dirname, '..', 'responses');
  
  // Read both test result files
  const noRegionFile = path.join(responsesDir, 'test1_no_regional_limitation.json');
  const seoulOnlyFile = path.join(responsesDir, 'test2_seoul_only.json');
  
  if (!fs.existsSync(noRegionFile) || !fs.existsSync(seoulOnlyFile)) {
    console.error('Test result files not found');
    return;
  }

  const noRegionData = JSON.parse(fs.readFileSync(noRegionFile, 'utf8'));
  const seoulOnlyData = JSON.parse(fs.readFileSync(seoulOnlyFile, 'utf8'));

  console.log('=== Regional Data Analysis ===');
  console.log(`No Regional Limitation: ${noRegionData.total_count} notices`);
  console.log(`Seoul Only: ${seoulOnlyData.total_count} notices`);
  console.log('');

  // Analyze regional fields in no limitation data
  console.log('=== Regional Fields Analysis (No Limitation) ===');
  const regionalFields = new Set<string>();
  const regionCounts: Record<string, number> = {};

  noRegionData.data.forEach((notice: any, index: number) => {
    // Check various regional fields
    const fields = [
      'prtcptLmtRgnNm',
      'rgnLmtBidLocplcJdgmBssNm', 
      'jntcontrctDutyRgnNm1',
      'jntcontrctDutyRgnNm2', 
      'jntcontrctDutyRgnNm3',
      'ntceInsttNm',
      'dminsttNm'
    ];

    fields.forEach(field => {
      if (notice[field] && notice[field] !== '' && notice[field] !== 'N/A') {
        regionalFields.add(field);
        const key = `${field}: ${notice[field]}`;
        regionCounts[key] = (regionCounts[key] || 0) + 1;
      }
    });

    // Show first few examples with regional data
    if (index < 10) {
      const hasRegionalInfo = fields.some(field => 
        notice[field] && notice[field] !== '' && notice[field] !== 'N/A'
      );
      
      if (hasRegionalInfo) {
        console.log(`\n--- Notice ${index + 1}: ${notice.bidNtceNm} ---`);
        fields.forEach(field => {
          if (notice[field] && notice[field] !== '' && notice[field] !== 'N/A') {
            console.log(`  ${field}: ${notice[field]}`);
          }
        });
      }
    }
  });

  console.log('\n=== Regional Field Summary ===');
  console.log('Fields with regional data:', Array.from(regionalFields));
  
  console.log('\n=== Regional Data Distribution ===');
  Object.entries(regionCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20) // Show top 20
    .forEach(([key, count]) => {
      console.log(`  ${key}: ${count}건`);
    });

  // Compare specific notices between two datasets
  console.log('\n=== Comparison Analysis ===');
  const noRegionIds = new Set(noRegionData.data.map((n: any) => n.bidNtceNo));
  const seoulOnlyIds = new Set(seoulOnlyData.data.map((n: any) => n.bidNtceNo));
  
  const onlyInNoRegion = noRegionData.data.filter((n: any) => !seoulOnlyIds.has(n.bidNtceNo));
  const onlyInSeoul = seoulOnlyData.data.filter((n: any) => !noRegionIds.has(n.bidNtceNo));
  const inBoth = noRegionData.data.filter((n: any) => seoulOnlyIds.has(n.bidNtceNo));

  console.log(`Only in No Regional Limitation: ${onlyInNoRegion.length}건`);
  console.log(`Only in Seoul Only: ${onlyInSeoul.length}건`);
  console.log(`In Both: ${inBoth.length}건`);

  if (onlyInSeoul.length > 0) {
    console.log('\n=== Seoul Only Examples ===');
    onlyInSeoul.slice(0, 3).forEach((notice: any, index: number) => {
      console.log(`${index + 1}. ${notice.bidNtceNm}`);
      console.log(`   - ntceInsttNm: ${notice.ntceInsttNm || 'N/A'}`);
      console.log(`   - dminsttNm: ${notice.dminsttNm || 'N/A'}`);
      console.log(`   - prtcptLmtRgnNm: ${notice.prtcptLmtRgnNm || 'N/A'}`);
    });
  }
}

// Run analysis
analyzeRegionalData();