/**
 * Run All Tests
 * Comprehensive test runner for all implemented features
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Starting Comprehensive Test Suite...\n');

const testSuites = [
  'services/twoFactorService.test.js',
  'services/encryptionService.test.js',
  'services/cacheService.test.js',
  'api/twoFactor.test.js',
  'api/inventory.test.js',
  'api/procurement.test.js',
  'api/financial.test.js',
  'api/graphql.test.js',
  'api/webhooks.test.js',
  'api/projectEnhancements.test.js',
  'api/crmEnhancements.test.js',
];

let passed = 0;
let failed = 0;
const results = [];

testSuites.forEach((suite, index) => {
  console.log(`\n[${index + 1}/${testSuites.length}] Running ${suite}...`);
  try {
    execSync(`npx jest ${suite} --verbose`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
    passed++;
    results.push({ suite, status: 'PASSED' });
    console.log(`✅ ${suite} - PASSED\n`);
  } catch (error) {
    failed++;
    results.push({ suite, status: 'FAILED', error: error.message });
    console.log(`❌ ${suite} - FAILED\n`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Suites: ${testSuites.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testSuites.length) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

if (failed > 0) {
  console.log('\n❌ Failed Test Suites:');
  results
    .filter(r => r.status === 'FAILED')
    .forEach(r => {
      console.log(`  - ${r.suite}`);
    });
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}
