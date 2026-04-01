/**
 * Create Clean Production Build
 * Removes unnecessary files from the build
 */

const fs = require('fs');
const path = require('path');

const buildDir = 'dist/Punchiri Billing System-win32-x64/resources/app';

console.log('🧹 Cleaning production build...\n');

// Files and folders to remove
const itemsToRemove = [
    // Test files
    'test-*.js',
    'test-*.html',
    'comprehensive-test.js',
    'functional-test.js',
    'verify-fifo-restoration.js',
    'check-bills.js',
    'db-check.js',
    
    // Build scripts
    'build-final.js',
    'create-portable.ps1',
    'create-payment-table.js',
    'migrate-barcode.js',
    'add-realtime-broadcasts.js',
    
    // Old documentation
    'BARCODE_FIX_README.md',
    'CORRECTED-QUICK-REFERENCE.txt',
    'QUICK-REFERENCE.txt',
    'DEPLOYMENT-READY-SUMMARY.md',
    'IMPORTANT-CREDENTIALS-UPDATE.md',
    'FINAL-TEST-CHECKLIST.md',
    'test-report.txt',
    
    // Build artifacts
    'electron-builder.yml',
    'BUILD_INFO.json',
    
    // Old zips
    '*.zip',
    
    // Test folders
    'TEST_EXTRACTION',
    'TEST_PORTABLE',
    'uploads'
];

let removedCount = 0;

function removeItem(itemPath) {
    try {
        if (fs.existsSync(itemPath)) {
            const stats = fs.statSync(itemPath);
            if (stats.isDirectory()) {
                fs.rmSync(itemPath, { recursive: true, force: true });
                console.log(`✅ Removed folder: ${path.basename(itemPath)}`);
            } else {
                fs.unlinkSync(itemPath);
                console.log(`✅ Removed file: ${path.basename(itemPath)}`);
            }
            removedCount++;
            return true;
        }
    } catch (error) {
        console.log(`⚠️  Could not remove: ${path.basename(itemPath)}`);
    }
    return false;
}

// Remove items
itemsToRemove.forEach(pattern => {
    const fullPath = path.join(buildDir, pattern);
    
    if (pattern.includes('*')) {
        // Handle wildcards
        const dir = path.dirname(fullPath);
        const filePattern = path.basename(pattern);
        const regex = new RegExp('^' + filePattern.replace(/\*/g, '.*') + '$');
        
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                if (regex.test(file)) {
                    removeItem(path.join(dir, file));
                }
            });
        }
    } else {
        removeItem(fullPath);
    }
});

console.log(`\n✅ Cleanup complete! Removed ${removedCount} items.\n`);
console.log('📦 Production build is now clean and ready for distribution.\n');
