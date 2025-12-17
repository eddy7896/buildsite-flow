/**
 * Schema Verification Script
 * 
 * This script verifies that all schema modules are properly structured
 * and can be imported without errors.
 */

const fs = require('fs');
const path = require('path');

const schemaDir = __dirname;
const modules = [
  'sharedFunctions',
  'authSchema',
  'agenciesSchema',
  'departmentsSchema',
  'hrSchema',
  'projectsTasksSchema',
  'clientsFinancialSchema',
  'crmSchema',
  'gstSchema',
  'reimbursementSchema',
  'miscSchema',
  'indexesAndFixes'
];

console.log('🔍 Verifying schema modules...\n');

let allPassed = true;

// Check if all module files exist
console.log('📁 Checking module files...');
modules.forEach(moduleName => {
  const filePath = path.join(schemaDir, `${moduleName}.js`);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${moduleName}.js exists`);
  } else {
    console.log(`  ❌ ${moduleName}.js missing`);
    allPassed = false;
  }
});

// Check if modules can be imported
console.log('\n📦 Checking module imports...');
modules.forEach(moduleName => {
  try {
    const module = require(`./${moduleName}`);
    const expectedExports = {
      'sharedFunctions': ['ensureSharedFunctions', 'ensureUpdatedAtTriggers'],
      'authSchema': ['ensureAuthSchema'],
      'agenciesSchema': ['ensureAgenciesSchema'],
      'departmentsSchema': ['ensureDepartmentsSchema'],
      'hrSchema': ['ensureHrSchema'],
      'projectsTasksSchema': ['ensureProjectsTasksSchema'],
      'clientsFinancialSchema': ['ensureClientsFinancialSchema'],
      'crmSchema': ['ensureCrmSchema'],
      'gstSchema': ['ensureGstSchema'],
      'reimbursementSchema': ['ensureReimbursementSchema'],
      'miscSchema': ['ensureMiscSchema'],
      'indexesAndFixes': ['ensureIndexesAndFixes']
    };
    
    const exports = expectedExports[moduleName] || [];
    let moduleValid = true;
    
    exports.forEach(exportName => {
      if (typeof module[exportName] !== 'function') {
        console.log(`  ❌ ${moduleName} missing export: ${exportName}`);
        moduleValid = false;
        allPassed = false;
      }
    });
    
    if (moduleValid) {
      console.log(`  ✅ ${moduleName} exports correctly`);
    }
  } catch (error) {
    console.log(`  ❌ ${moduleName} import failed: ${error.message}`);
    allPassed = false;
  }
});

// Check main schemaCreator
console.log('\n🎯 Checking main schemaCreator...');
try {
  const schemaCreator = require('../schemaCreator');
  if (typeof schemaCreator.createAgencySchema === 'function') {
    console.log('  ✅ schemaCreator.createAgencySchema exists');
  } else {
    console.log('  ❌ schemaCreator.createAgencySchema missing');
    allPassed = false;
  }
} catch (error) {
  console.log(`  ❌ schemaCreator import failed: ${error.message}`);
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All verifications passed!');
  process.exit(0);
} else {
  console.log('❌ Some verifications failed!');
  process.exit(1);
}
