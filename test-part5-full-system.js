/**
 * PART 5 - FULL SYSTEM TESTING
 * 
 * Comprehensive test suite for all implemented features:
 * - Part 1: Billing System Updates
 * - Part 2: Add Stock & Pricing
 * - Part 3: Product Table
 * - Part 4: Database & Backup Updates
 * 
 * This script performs automated testing where possible
 * and provides manual testing checklists for UI features
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         PART 5 - FULL SYSTEM TESTING                       ║');
console.log('║         Punchiri Store Billing System                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Test Results Tracker
const testResults = {
    passed: 0,
    failed: 0,
    manual: 0,
    tests: []
};

function logTest(category, test, status, details = '') {
    const symbols = {
        pass: '✅',
        fail: '❌',
        manual: '🔍',
        info: 'ℹ️'
    };
    
    const result = {
        category,
        test,
        status,
        details
    };
    
    testResults.tests.push(result);
    
    if (status === 'pass') testResults.passed++;
    else if (status === 'fail') testResults.failed++;
    else if (status === 'manual') testResults.manual++;
    
    console.log(`${symbols[status]} [${category}] ${test}`);
    if (details) console.log(`   ${details}`);
}

// ============================================================================
// PART 1: BILLING SYSTEM TESTS
// ============================================================================
function testPart1Billing() {
    console.log('\n═══ PART 1: BILLING SYSTEM UPDATES ═══\n');
    
    // Test 1.1: Check billing_v2.html exists and has required features
    const billingFile = './frontend/billing_v2.html';
    
    if (fs.existsSync(billingFile)) {
        logTest('Part 1', 'Billing file exists', 'pass', billingFile);
        
        const content = fs.readFileSync(billingFile, 'utf8');
        
        // Check for barcode scanning (continuous)
        if (content.includes('barcode') || content.includes('scan')) {
            logTest('Part 1', 'Barcode scanning code present', 'pass');
        } else {
            logTest('Part 1', 'Barcode scanning code', 'fail', 'Code not found');
        }
        
        // Check for bill switching shortcuts
        if (content.includes('Ctrl') && (content.includes('ArrowLeft') || content.includes('ArrowRight'))) {
            logTest('Part 1', 'Bill switching shortcuts (Ctrl + ←/→)', 'pass');
        } else {
            logTest('Part 1', 'Bill switching shortcuts', 'fail', 'Shortcuts not found');
        }
        
        // Check for remove last item (Ctrl+Q)
        if (content.includes('KeyQ') || content.includes('Ctrl+Q')) {
            logTest('Part 1', 'Remove last item shortcut (Ctrl+Q)', 'pass');
        } else {
            logTest('Part 1', 'Remove last item shortcut', 'fail', 'Ctrl+Q not found');
        }
        
        // Check for payment flow
        if (content.includes('Shift') && content.includes('Enter')) {
            logTest('Part 1', 'Payment flow (Shift+Enter)', 'pass');
        } else {
            logTest('Part 1', 'Payment flow', 'fail', 'Shift+Enter not found');
        }
        
    } else {
        logTest('Part 1', 'Billing file exists', 'fail', 'File not found');
    }
    
    // Manual tests required
    logTest('Part 1', 'Barcode scanning behavior (no popup, auto-add)', 'manual', 'Test in browser');
    logTest('Part 1', 'Continuous scanning (cursor stays in input)', 'manual', 'Test in browser');
    logTest('Part 1', 'Bill switching with Ctrl+← and Ctrl+→', 'manual', 'Test in browser');
    logTest('Part 1', 'Ctrl+Q removes/reduces last item', 'manual', 'Test in browser');
    logTest('Part 1', 'Print popup: Cancel button focused, arrow keys work', 'manual', 'Test in browser');
    logTest('Part 1', 'Shift+Enter focuses payment field (mandatory)', 'manual', 'Test in browser');
    logTest('Part 1', 'Customer OB removed from UI', 'manual', 'Test in browser');
}

// ============================================================================
// PART 2: ADD STOCK & PRICING TESTS
// ============================================================================
function testPart2AddStock() {
    console.log('\n═══ PART 2: ADD STOCK & PRICING ═══\n');
    
    const addStockFile = './frontend/add_stock.html';
    
    if (fs.existsSync(addStockFile)) {
        logTest('Part 2', 'Add stock file exists', 'pass', addStockFile);
        
        const content = fs.readFileSync(addStockFile, 'utf8');
        
        // Check for search field merge
        if (content.includes('search') || content.includes('Search')) {
            logTest('Part 2', 'Search field present', 'pass');
        } else {
            logTest('Part 2', 'Search field', 'fail', 'Not found');
        }
        
        // Check for sessionStorage (item persistence)
        if (content.includes('sessionStorage')) {
            logTest('Part 2', 'Item selection persistence (sessionStorage)', 'pass');
        } else {
            logTest('Part 2', 'Item selection persistence', 'fail', 'sessionStorage not found');
        }
        
        // Check for price entry fields
        const hasPriceFields = content.includes('retail') && 
                              content.includes('wholesale') && 
                              content.includes('special');
        
        if (hasPriceFields) {
            logTest('Part 2', 'Price entry fields (retail/wholesale/special)', 'pass');
        } else {
            logTest('Part 2', 'Price entry fields', 'fail', 'Missing price fields');
        }
        
    } else {
        logTest('Part 2', 'Add stock file exists', 'fail', 'File not found');
    }
    
    // Manual tests required
    logTest('Part 2', 'Search field: barcode OR product name', 'manual', 'Test in browser');
    logTest('Part 2', 'Item selection persists after viewing history', 'manual', 'Test in browser');
    logTest('Part 2', 'Mouse works after saving stock', 'manual', 'Test in browser');
    logTest('Part 2', 'Price entry flow: Retail→Wholesale→Special→Save', 'manual', 'Test in browser');
    logTest('Part 2', 'Enter key navigation through price fields', 'manual', 'Test in browser');
    logTest('Part 2', 'Purchase history: same day shows updated prices', 'manual', 'Test in browser');
    logTest('Part 2', 'Purchase history: next day shows "Price Updated" column', 'manual', 'Test in browser');
}

// ============================================================================
// PART 3: PRODUCT TABLE TESTS
// ============================================================================
function testPart3Products() {
    console.log('\n═══ PART 3: PRODUCT TABLE ═══\n');
    
    const productsFile = './frontend/products.html';
    
    if (fs.existsSync(productsFile)) {
        logTest('Part 3', 'Products file exists', 'pass', productsFile);
        
        const content = fs.readFileSync(productsFile, 'utf8');
        
        // Check for Edit Barcode button (not 3-dot menu)
        if (content.includes('btn-edit-barcode') || content.includes('Edit Barcode')) {
            logTest('Part 3', 'Edit Barcode button present', 'pass');
        } else {
            logTest('Part 3', 'Edit Barcode button', 'fail', 'Button not found');
        }
        
        // Check 3-dot menu is removed
        if (!content.includes('actions-dropdown') && !content.includes('dots-icon')) {
            logTest('Part 3', '3-dot menu removed', 'pass');
        } else {
            logTest('Part 3', '3-dot menu removed', 'fail', 'Still present in code');
        }
        
        // Check for sortable columns
        if (content.includes('sortUnit') && content.includes('sortStatus')) {
            logTest('Part 3', 'Unit and Status columns sortable', 'pass');
        } else {
            logTest('Part 3', 'Sortable columns', 'fail', 'sortUnit or sortStatus not found');
        }
        
        // Check for barcode validation
        if (content.includes('already exists') || content.includes('duplicate')) {
            logTest('Part 3', 'Barcode validation code present', 'pass');
        } else {
            logTest('Part 3', 'Barcode validation', 'fail', 'Validation code not found');
        }
        
    } else {
        logTest('Part 3', 'Products file exists', 'fail', 'File not found');
    }
    
    // Check server.js for backend validation
    const serverFile = './server.js';
    if (fs.existsSync(serverFile)) {
        const serverContent = fs.readFileSync(serverFile, 'utf8');
        
        if (serverContent.includes('Barcode already exists')) {
            logTest('Part 3', 'Backend barcode validation', 'pass');
        } else {
            logTest('Part 3', 'Backend barcode validation', 'fail', 'Not found in server.js');
        }
    }
    
    // Manual tests required
    logTest('Part 3', 'Edit Barcode button opens modal', 'manual', 'Test in browser');
    logTest('Part 3', 'Duplicate barcode shows error', 'manual', 'Test in browser');
    logTest('Part 3', 'Unique barcode saves successfully', 'manual', 'Test in browser');
    logTest('Part 3', 'Empty barcode allowed (saves as null)', 'manual', 'Test in browser');
    logTest('Part 3', 'Click Unit header to sort by kg/pc', 'manual', 'Test in browser');
    logTest('Part 3', 'Click Status header to sort by Active/Inactive', 'manual', 'Test in browser');
    logTest('Part 3', 'Sort indicators (↑↓) display correctly', 'manual', 'Test in browser');
}

// ============================================================================
// PART 4: DATABASE & BACKUP TESTS
// ============================================================================
function testPart4Backup() {
    console.log('\n═══ PART 4: DATABASE & BACKUP UPDATES ═══\n');
    
    const backupFile = './backup-manager.js';
    
    if (fs.existsSync(backupFile)) {
        logTest('Part 4', 'Backup manager file exists', 'pass', backupFile);
        
        const content = fs.readFileSync(backupFile, 'utf8');
        
        // Check for storedb prefix
        if (content.includes('storedb_')) {
            logTest('Part 4', 'Backup prefix changed to "storedb"', 'pass');
        } else {
            logTest('Part 4', 'Backup prefix', 'fail', 'storedb_ not found');
        }
        
        // Check for old shopdb prefix (should not exist)
        if (!content.includes('shopdb_')) {
            logTest('Part 4', 'Old "shopdb" prefix removed', 'pass');
        } else {
            logTest('Part 4', 'Old prefix removed', 'fail', 'shopdb_ still present');
        }
        
        // Check for divClose numbering
        if (content.includes('divClose_') && content.includes('getNextCloseNumber')) {
            logTest('Part 4', 'Multi-close sequential numbering', 'pass');
        } else {
            logTest('Part 4', 'Multi-close support', 'fail', 'Numbering logic not found');
        }
        
    } else {
        logTest('Part 4', 'Backup manager file exists', 'fail', 'File not found');
    }
    
    // Check backup directory
    const backupDir = './backups';
    if (fs.existsSync(backupDir)) {
        logTest('Part 4', 'Backup directory exists', 'pass', backupDir);
        
        const files = fs.readdirSync(backupDir);
        const storedbFiles = files.filter(f => f.startsWith('storedb_'));
        const shopdbFiles = files.filter(f => f.startsWith('shopdb_'));
        
        if (storedbFiles.length > 0) {
            logTest('Part 4', `New format backups found (${storedbFiles.length})`, 'pass');
        } else {
            logTest('Part 4', 'New format backups', 'info', 'No storedb backups yet (will be created on next backup)');
        }
        
        if (shopdbFiles.length > 0) {
            logTest('Part 4', `Legacy backups preserved (${shopdbFiles.length})`, 'pass', 'Backward compatible');
        }
        
    } else {
        logTest('Part 4', 'Backup directory exists', 'fail', 'Directory not found');
    }
    
    // Manual tests required
    logTest('Part 4', 'Automatic backup at 12 PM creates divOpen file', 'manual', 'Wait for 12 PM or adjust cron');
    logTest('Part 4', 'Manual close creates divClose_1.db', 'manual', 'Test store closing');
    logTest('Part 4', 'Second close creates divClose_2.db', 'manual', 'Test multiple closes');
    logTest('Part 4', 'Next day resets numbering to _1', 'manual', 'Test across days');
    logTest('Part 4', 'Backups uploaded to Cloudflare R2', 'manual', 'Check R2 bucket');
}

// ============================================================================
// CRASH & EDGE CASE TESTS
// ============================================================================
function testEdgeCases() {
    console.log('\n═══ CRASH & EDGE CASE TESTS ═══\n');
    
    // File integrity checks
    const criticalFiles = [
        './server.js',
        './database.js',
        './backup-manager.js',
        './frontend/billing_v2.html',
        './frontend/add_stock.html',
        './frontend/products.html',
        './package.json'
    ];
    
    criticalFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            if (stats.size > 0) {
                logTest('Edge Cases', `File integrity: ${path.basename(file)}`, 'pass', `${(stats.size / 1024).toFixed(2)} KB`);
            } else {
                logTest('Edge Cases', `File integrity: ${path.basename(file)}`, 'fail', 'File is empty');
            }
        } else {
            logTest('Edge Cases', `File exists: ${path.basename(file)}`, 'fail', 'File not found');
        }
    });
    
    // Manual edge case tests
    logTest('Edge Cases', 'Page refresh during billing', 'manual', 'Test data persistence');
    logTest('Edge Cases', 'Multiple tabs open simultaneously', 'manual', 'Test data sync');
    logTest('Edge Cases', 'Fast barcode scanning (10+ items)', 'manual', 'Test performance');
    logTest('Edge Cases', 'Network error during backup', 'manual', 'Test error handling');
    logTest('Edge Cases', 'Invalid barcode format', 'manual', 'Test validation');
    logTest('Edge Cases', 'Negative quantity input', 'manual', 'Test validation');
    logTest('Edge Cases', 'Zero price input', 'manual', 'Test validation');
    logTest('Edge Cases', 'Very long product name (100+ chars)', 'manual', 'Test UI handling');
    logTest('Edge Cases', 'Database locked during write', 'manual', 'Test concurrent access');
    logTest('Edge Cases', 'Disk full during backup', 'manual', 'Test error handling');
}

// ============================================================================
// GENERATE TEST REPORT
// ============================================================================
function generateReport() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const total = testResults.passed + testResults.failed + testResults.manual;
    const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`Total Tests:        ${total}`);
    console.log(`✅ Passed:          ${testResults.passed}`);
    console.log(`❌ Failed:          ${testResults.failed}`);
    console.log(`🔍 Manual Required: ${testResults.manual}`);
    console.log(`Pass Rate:          ${passRate}%\n`);
    
    // Show failed tests
    if (testResults.failed > 0) {
        console.log('❌ FAILED TESTS:\n');
        testResults.tests
            .filter(t => t.status === 'fail')
            .forEach(t => {
                console.log(`   [${t.category}] ${t.test}`);
                if (t.details) console.log(`      → ${t.details}`);
            });
        console.log('');
    }
    
    // Show manual tests
    if (testResults.manual > 0) {
        console.log('🔍 MANUAL TESTS REQUIRED:\n');
        testResults.tests
            .filter(t => t.status === 'manual')
            .forEach(t => {
                console.log(`   [${t.category}] ${t.test}`);
                if (t.details) console.log(`      → ${t.details}`);
            });
        console.log('');
    }
    
    // Overall status
    console.log('═══════════════════════════════════════════════════════════\n');
    if (testResults.failed === 0) {
        console.log('✅ ALL AUTOMATED TESTS PASSED!\n');
        console.log('Next Steps:');
        console.log('1. Complete manual testing in browser');
        console.log('2. Test all keyboard shortcuts');
        console.log('3. Test edge cases and error scenarios');
        console.log('4. Verify backup system end-to-end');
        console.log('5. Generate final report (Part 6)');
    } else {
        console.log('❌ SOME TESTS FAILED - REVIEW REQUIRED\n');
        console.log('Please fix failed tests before proceeding to Part 6');
    }
    console.log('');
    
    // Save report to file
    const reportContent = generateMarkdownReport();
    fs.writeFileSync('TEST_REPORT_PART5.md', reportContent);
    console.log('📄 Detailed report saved to: TEST_REPORT_PART5.md\n');
}

function generateMarkdownReport() {
    const timestamp = new Date().toISOString();
    let md = `# PART 5 - FULL SYSTEM TEST REPORT\n\n`;
    md += `**Generated:** ${timestamp}\n\n`;
    md += `## Summary\n\n`;
    md += `- Total Tests: ${testResults.passed + testResults.failed + testResults.manual}\n`;
    md += `- ✅ Passed: ${testResults.passed}\n`;
    md += `- ❌ Failed: ${testResults.failed}\n`;
    md += `- 🔍 Manual Required: ${testResults.manual}\n\n`;
    
    // Group by category
    const categories = [...new Set(testResults.tests.map(t => t.category))];
    
    categories.forEach(category => {
        md += `## ${category}\n\n`;
        const categoryTests = testResults.tests.filter(t => t.category === category);
        
        categoryTests.forEach(test => {
            const symbol = test.status === 'pass' ? '✅' : 
                          test.status === 'fail' ? '❌' : '🔍';
            md += `${symbol} **${test.test}**\n`;
            if (test.details) md += `   - ${test.details}\n`;
            md += `\n`;
        });
    });
    
    return md;
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
function runAllTests() {
    try {
        testPart1Billing();
        testPart2AddStock();
        testPart3Products();
        testPart4Backup();
        testEdgeCases();
        generateReport();
    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
        console.error(error.stack);
    }
}

// Execute tests
runAllTests();
