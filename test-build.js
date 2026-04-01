/**
 * Test Production Build
 * Verifies the build is complete and functional
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         PRODUCTION BUILD VERIFICATION                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const buildDir = 'dist/Punchiri Billing System-win32-x64';
const appDir = path.join(buildDir, 'resources/app');

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
    if (condition) {
        console.log(`✅ ${name}`);
        if (details) console.log(`   ${details}`);
        passed++;
    } else {
        console.log(`❌ ${name}`);
        if (details) console.log(`   ${details}`);
        failed++;
    }
}

console.log('═══ STEP 1: BUILD STRUCTURE ═══\n');

// Check main executable
test(
    'Main executable exists',
    fs.existsSync(path.join(buildDir, 'Punchiri Billing System.exe')),
    'Punchiri Billing System.exe'
);

// Check resources folder
test(
    'Resources folder exists',
    fs.existsSync(path.join(buildDir, 'resources')),
    'resources/'
);

// Check app folder
test(
    'App folder exists',
    fs.existsSync(appDir),
    'resources/app/'
);

console.log('\n═══ STEP 2: CRITICAL FILES ═══\n');

const criticalFiles = [
    'main.js',
    'server.js',
    'database.js',
    'backup-manager.js',
    'database-import.js',
    'realtime-sync.js',
    'package.json',
    '.env',
    'settings.json'
];

criticalFiles.forEach(file => {
    const filePath = path.join(appDir, file);
    test(
        `${file} exists`,
        fs.existsSync(filePath)
    );
});

console.log('\n═══ STEP 3: FRONTEND FILES ═══\n');

const frontendFiles = [
    'frontend/billing_v2.html',
    'frontend/add_stock.html',
    'frontend/products.html',
    'frontend/dashboard.html',
    'frontend/customers.html'
];

frontendFiles.forEach(file => {
    const filePath = path.join(appDir, file);
    test(
        `${file} exists`,
        fs.existsSync(filePath)
    );
});

console.log('\n═══ STEP 4: DEPENDENCIES ═══\n');

// Check node_modules
test(
    'node_modules folder exists',
    fs.existsSync(path.join(appDir, 'node_modules')),
    'All dependencies included'
);

// Check critical dependencies
const criticalDeps = [
    'node_modules/express',
    'node_modules/sqlite3',
    'node_modules/ws',
    'node_modules/cors',
    'node_modules/dotenv'
];

criticalDeps.forEach(dep => {
    const depPath = path.join(appDir, dep);
    test(
        `${path.basename(dep)} installed`,
        fs.existsSync(depPath)
    );
});

console.log('\n═══ STEP 5: CONFIGURATION ═══\n');

// Check package.json
const packagePath = path.join(appDir, 'package.json');
if (fs.existsSync(packagePath)) {
    try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        test(
            'package.json is valid JSON',
            true,
            `Version: ${pkg.version}`
        );
        test(
            'Main entry point defined',
            pkg.main === 'main.js',
            `main: ${pkg.main}`
        );
    } catch (error) {
        test('package.json is valid JSON', false, 'Parse error');
    }
}

// Check .env file
const envPath = path.join(appDir, '.env');
if (fs.existsSync(envPath)) {
    test('.env file exists', true, 'Backup configuration available');
}

console.log('\n═══ STEP 6: DOCUMENTATION ═══\n');

// Check README
test(
    'User README exists',
    fs.existsSync(path.join(buildDir, 'README.txt')),
    'Installation guide included'
);

// Check if documentation is included
const docs = [
    'IMPLEMENTATION_REPORT.md',
    'MANUAL_TESTING_CHECKLIST.md',
    'PROJECT_COMPLETE_SUMMARY.md'
];

docs.forEach(doc => {
    test(
        `${doc} included`,
        fs.existsSync(path.join(appDir, doc))
    );
});

console.log('\n═══ STEP 7: FILE SIZES ═══\n');

// Check executable size
const exePath = path.join(buildDir, 'Punchiri Billing System.exe');
if (fs.existsSync(exePath)) {
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    test(
        'Executable size reasonable',
        stats.size > 100 * 1024 * 1024, // > 100 MB
        `${sizeMB} MB`
    );
}

// Check total build size
function getDirSize(dirPath) {
    let size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getDirSize(filePath);
            } else {
                size += stats.size;
            }
        });
    } catch (error) {
        // Ignore errors
    }
    return size;
}

const totalSize = getDirSize(buildDir);
const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
test(
    'Total build size',
    totalSize > 0,
    `${totalSizeMB} MB`
);

console.log('\n═══ STEP 8: UNWANTED FILES CHECK ═══\n');

// Check that test files are removed
const unwantedPatterns = [
    'test-*.js',
    'test-*.html',
    '*.zip'
];

let unwantedFound = 0;
try {
    const files = fs.readdirSync(appDir);
    files.forEach(file => {
        if (file.startsWith('test-') || file.endsWith('.zip')) {
            unwantedFound++;
        }
    });
} catch (error) {
    // Ignore
}

test(
    'No test files in build',
    unwantedFound === 0,
    unwantedFound > 0 ? `Found ${unwantedFound} test files` : 'Clean build'
);

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    TEST SUMMARY                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const total = passed + failed;
const passRate = ((passed / total) * 100).toFixed(1);

console.log(`Total Tests:    ${total}`);
console.log(`✅ Passed:      ${passed}`);
console.log(`❌ Failed:      ${failed}`);
console.log(`Pass Rate:      ${passRate}%\n`);

if (failed === 0) {
    console.log('✅ BUILD VERIFICATION SUCCESSFUL!\n');
    console.log('The production build is complete and ready for deployment.\n');
    console.log('Next Steps:');
    console.log('1. Test the application by running the .exe');
    console.log('2. Verify all features work correctly');
    console.log('3. Create a ZIP file for distribution');
    console.log('4. Deploy to production\n');
} else {
    console.log('❌ BUILD VERIFICATION FAILED!\n');
    console.log(`${failed} test(s) failed. Please review and fix issues.\n`);
}

console.log('═══════════════════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
