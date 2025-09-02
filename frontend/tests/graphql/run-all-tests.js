import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFiles = [
  'test-base.js',
  'test-notice.js', 
  'test-bid.js',
  'test-settings.js',
  'test-spider.js',
  'test-mysql.js',
  'test-statistics.js'
];

console.log('🚀 Starting GraphQL Integration Tests');
console.log('=====================================');
console.log(`GraphQL Endpoint: http://localhost:11501/api/graphql`);
console.log(`Running ${testFiles.length} test suites...`);
console.log('');

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    const testPath = join(__dirname, testFile);
    const child = spawn('node', ['--test', testPath], {
      stdio: 'pipe',
      cwd: __dirname
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ testFile, output, success: true });
      } else {
        resolve({ testFile, output: output + errorOutput, success: false, code });
      }
    });

    child.on('error', (error) => {
      reject({ testFile, error: error.message });
    });
  });
}

async function runAllTests() {
  const results = [];
  let passCount = 0;
  let failCount = 0;

  for (const testFile of testFiles) {
    console.log(`📋 Running ${testFile}...`);
    
    try {
      const result = await runTest(testFile);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ ${testFile} - PASSED`);
        passCount++;
      } else {
        console.log(`❌ ${testFile} - FAILED (exit code: ${result.code})`);
        console.log(`   Output: ${result.output.slice(0, 200)}...`);
        failCount++;
      }
    } catch (error) {
      console.log(`💥 ${testFile} - ERROR: ${error.error}`);
      results.push({ testFile: error.testFile, success: false, error: error.error });
      failCount++;
    }
    
    console.log('');
  }

  // Summary
  console.log('=====================================');
  console.log('🏁 Test Results Summary');
  console.log('=====================================');
  console.log(`Total Test Suites: ${testFiles.length}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('');

  if (failCount > 0) {
    console.log('Failed Tests Details:');
    console.log('-------------------');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`- ${r.testFile}: ${r.error || 'Test failed'}`);
      });
  }

  console.log('');
  console.log('💡 Tips:');
  console.log('- Make sure the frontend server is running on port 11501');
  console.log('- Ensure all backend servers are running and accessible');
  console.log('- Check network connectivity to backend services');
  console.log('- Run individual tests with: node --test test-[name].js');
  
  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests().catch(console.error);