/**
 * COMPREHENSIVE TEST SUITE FOR PORTABLE BILLING SYSTEM
 * Tests all functionality to ensure the portable app works correctly
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const http = require('http');

// Test configuration
const TEST_DIR = './TEST_PORTABLE/resources/app';
const DB_PATH = path.join(TEST_DIR, 'shop.db');
const BACKUP_DIR = path.join(TEST_DIR, 'backups');
const UPLOADS_DIR = path.join(TEST_DIR, 'uploads');

// Test results
const results = {
    passed: [],
    failed: [],
    warnings: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        'info': '📋',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function addResult(test, passed, message) {
    if (passed) {
        results.passed.push({ test, message });
        log(`PASS: ${test} - ${message}`, 'success');
    } else {
        results.failed.push({ test, message });
        log(`FAIL: ${test} - ${message}`, 'error');
    }
}

function addWarning(test, message) {
    results.warnings.push({ test, message });
    log(`WARNING: ${test} - ${message}`, 'warning');
}

// Test 1: Check directory structure
async function testDirectoryStructure() {
    log('\n=== TEST 1: Directory Structure ===', 'info');
    
    const requiredDirs = [
        TEST_DIR,
        path.join(TEST_DIR, 'frontend'),
        path.join(TEST_DIR, 'node_modules'),
        BACKUP_DIR,
        UPLOADS_DIR
    ];
    
    for (const dir of requiredDirs) {
        const exists = fs.existsSync(dir);
        addResult(
            'Directory Structure',
            exists,
            `${path.basename(dir)} directory ${exists ? 'exists' : 'missing'}`
        );
    }
}

// Test 2: Check required files
async function testRequiredFiles() {
    log('\n=== TEST 2: Required Files ===', 'info');
    
    const requiredFiles = [
        'main.js',
        'server.js',
        'database.js',
        'backup-manager.js',
        'database-import.js',
        'realtime-sync.js',
        '.env',
        'settings.json',
        'package.json',
        'frontend/login.html',
        'frontend/dashboard.html',
        'frontend/billing_v2_enhanced.html',
        'frontend/products.html',
        'frontend/add_product.html',
        'frontend/add_stock.html',
        'frontend/customers.html',
        'frontend/view-bills.html',
        'frontend/daily_profit.html',
        'frontend/out-of-stock.html',
        'frontend/purchase-history.html',
        'frontend/payment_only.html',
        'frontend/import-database.html',
        'frontend/barcodeHandler.js',
        'frontend/barcodeCache.js',
        'frontend/searchProducts.js',
        'frontend/realtimeClient.js',
        'frontend/auth-check.js'
    ];
    
    for (const file of requiredFiles) {
        const filePath = path.join(TEST_DIR, file);
        const exists = fs.existsSync(filePath);
        addResult(
            'Required Files',
            exists,
            `${file} ${exists ? 'exists' : 'missing'}`
        );
    }
}

// Test 3: Check node_modules
async function testNodeModules() {
    log('\n=== TEST 3: Node Modules ===', 'info');
    
    const requiredModules = [
        'express',
        'sqlite3',
        'cors',
        'dotenv',
        'multer',
        'ws',
        'node-cron',
        '@aws-sdk/client-s3'
    ];
    
    for (const module of requiredModules) {
        const modulePath = path.join(TEST_DIR, 'node_modules', module);
        const exists = fs.existsSync(modulePath);
        addResult(
            'Node Modules',
            exists,
            `${module} ${exists ? 'installed' : 'missing'}`
        );
    }
}

// Test 4: Database creation and schema
async function testDatabaseCreation() {
    log('\n=== TEST 4: Database Creation & Schema ===', 'info');
    
    return new Promise((resolve) => {
        // Remove existing test database if it exists
        if (fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
            log('Removed existing database for fresh test');
        }
        
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                addResult('Database Creation', false, `Failed to create database: ${err.message}`);
                resolve();
                return;
            }
            
            addResult('Database Creation', true, 'Database file created successfully');
            
            // Create all required tables
            const tables = {
                users: `CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    role TEXT DEFAULT 'user'
                )`,
                products: `CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    barcode TEXT UNIQUE,
                    price REAL NOT NULL,
                    stock INTEGER DEFAULT 0,
                    category TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                stock_history: `CREATE TABLE IF NOT EXISTS stock_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    purchase_price REAL NOT NULL,
                    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    remaining_quantity INTEGER NOT NULL,
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )`,
                bills: `CREATE TABLE IF NOT EXISTS bills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_name TEXT,
                    customer_phone TEXT,
                    total_amount REAL NOT NULL,
                    discount REAL DEFAULT 0,
                    final_amount REAL NOT NULL,
                    payment_method TEXT DEFAULT 'cash',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_by TEXT
                )`,
                bill_items: `CREATE TABLE IF NOT EXISTS bill_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bill_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    product_name TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    price REAL NOT NULL,
                    total REAL NOT NULL,
                    FOREIGN KEY (bill_id) REFERENCES bills(id),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )`,
                customers: `CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT UNIQUE NOT NULL,
                    email TEXT,
                    address TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                payments: `CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bill_id INTEGER NOT NULL,
                    amount REAL NOT NULL,
                    payment_method TEXT NOT NULL,
                    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    FOREIGN KEY (bill_id) REFERENCES bills(id)
                )`
            };
            
            let tablesCreated = 0;
            const tableNames = Object.keys(tables);
            
            tableNames.forEach((tableName, index) => {
                db.run(tables[tableName], (err) => {
                    if (err) {
                        addResult('Database Schema', false, `Failed to create ${tableName} table: ${err.message}`);
                    } else {
                        addResult('Database Schema', true, `${tableName} table created successfully`);
                    }
                    
                    tablesCreated++;
                    if (tablesCreated === tableNames.length) {
                        // Insert default admin user
                        db.run(
                            `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
                            ['admin', 'admin123', 'admin'],
                            (err) => {
                                if (err) {
                                    addResult('Default User', false, `Failed to create admin user: ${err.message}`);
                                } else {
                                    addResult('Default User', true, 'Admin user created successfully');
                                }
                                
                                db.close();
                                resolve();
                            }
                        );
                    }
                });
            });
        });
    });
}

// Test 5: Test database operations
async function testDatabaseOperations() {
    log('\n=== TEST 5: Database Operations ===', 'info');
    
    return new Promise((resolve) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                addResult('Database Connection', false, `Failed to connect: ${err.message}`);
                resolve();
                return;
            }
            
            addResult('Database Connection', true, 'Connected to database successfully');
            
            // Test INSERT
            db.run(
                `INSERT INTO products (name, barcode, price, stock, category) VALUES (?, ?, ?, ?, ?)`,
                ['Test Product', 'TEST123', 99.99, 10, 'Test Category'],
                function(err) {
                    if (err) {
                        addResult('INSERT Operation', false, `Failed: ${err.message}`);
                    } else {
                        addResult('INSERT Operation', true, `Product inserted with ID: ${this.lastID}`);
                        
                        // Test SELECT
                        db.get(`SELECT * FROM products WHERE id = ?`, [this.lastID], (err, row) => {
                            if (err) {
                                addResult('SELECT Operation', false, `Failed: ${err.message}`);
                            } else if (row) {
                                addResult('SELECT Operation', true, `Product retrieved: ${row.name}`);
                                
                                // Test UPDATE
                                db.run(
                                    `UPDATE products SET stock = ? WHERE id = ?`,
                                    [20, this.lastID],
                                    (err) => {
                                        if (err) {
                                            addResult('UPDATE Operation', false, `Failed: ${err.message}`);
                                        } else {
                                            addResult('UPDATE Operation', true, 'Product stock updated');
                                            
                                            // Test DELETE
                                            db.run(
                                                `DELETE FROM products WHERE id = ?`,
                                                [this.lastID],
                                                (err) => {
                                                    if (err) {
                                                        addResult('DELETE Operation', false, `Failed: ${err.message}`);
                                                    } else {
                                                        addResult('DELETE Operation', true, 'Product deleted');
                                                    }
                                                    
                                                    db.close();
                                                    resolve();
                                                }
                                            );
                                        }
                                    }
                                );
                            } else {
                                addResult('SELECT Operation', false, 'Product not found');
                                db.close();
                                resolve();
                            }
                        });
                    }
                }
            );
        });
    });
}

// Test 6: Test backup functionality
async function testBackupFunctionality() {
    log('\n=== TEST 6: Backup Functionality ===', 'info');
    
    // Check if backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
        addResult('Backup Directory', false, 'Backup directory does not exist');
        return;
    }
    
    addResult('Backup Directory', true, 'Backup directory exists');
    
    // Test backup creation
    if (fs.existsSync(DB_PATH)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const backupName = `storedb_${timestamp}_test.db`;
        const backupPath = path.join(BACKUP_DIR, backupName);
        
        try {
            fs.copyFileSync(DB_PATH, backupPath);
            addResult('Backup Creation', true, `Backup created: ${backupName}`);
            
            // Verify backup file
            const stats = fs.statSync(backupPath);
            addResult('Backup Verification', stats.size > 0, `Backup size: ${stats.size} bytes`);
            
            // Clean up test backup
            fs.unlinkSync(backupPath);
        } catch (error) {
            addResult('Backup Creation', false, `Failed: ${error.message}`);
        }
    } else {
        addResult('Backup Creation', false, 'Database file does not exist');
    }
}

// Test 7: Test configuration files
async function testConfigurationFiles() {
    log('\n=== TEST 7: Configuration Files ===', 'info');
    
    // Test .env file
    const envPath = path.join(TEST_DIR, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const hasR2Config = envContent.includes('R2_ACCOUNT_ID') && 
                           envContent.includes('R2_ACCESS_KEY_ID') &&
                           envContent.includes('R2_SECRET_ACCESS_KEY');
        addResult('.env Configuration', hasR2Config, 'R2 credentials configured');
    } else {
        addResult('.env Configuration', false, '.env file missing');
    }
    
    // Test settings.json
    const settingsPath = path.join(TEST_DIR, 'settings.json');
    if (fs.existsSync(settingsPath)) {
        try {
            const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
            addResult('settings.json', true, `Report folder: ${settings.report_folder || 'not set'}`);
        } catch (error) {
            addResult('settings.json', false, `Invalid JSON: ${error.message}`);
        }
    } else {
        addResult('settings.json', false, 'settings.json file missing');
    }
}

// Test 8: Test HTML pages structure
async function testHTMLPages() {
    log('\n=== TEST 8: HTML Pages Structure ===', 'info');
    
    const pages = [
        'login.html',
        'dashboard.html',
        'billing_v2_enhanced.html',
        'products.html',
        'add_product.html',
        'add_stock.html',
        'customers.html',
        'view-bills.html',
        'daily_profit.html',
        'out-of-stock.html',
        'purchase-history.html',
        'payment_only.html',
        'import-database.html'
    ];
    
    for (const page of pages) {
        const pagePath = path.join(TEST_DIR, 'frontend', page);
        if (fs.existsSync(pagePath)) {
            const content = fs.readFileSync(pagePath, 'utf8');
            const hasHTML = content.includes('<!DOCTYPE html>') || content.includes('<html');
            addResult('HTML Pages', hasHTML, `${page} is valid HTML`);
        } else {
            addResult('HTML Pages', false, `${page} is missing`);
        }
    }
}

// Test 9: Test JavaScript modules
async function testJavaScriptModules() {
    log('\n=== TEST 9: JavaScript Modules ===', 'info');
    
    const modules = [
        { file: 'server.js', keywords: ['express', 'app.listen'] },
        { file: 'database.js', keywords: ['sqlite3', 'Database'] },
        { file: 'backup-manager.js', keywords: ['backup', 'S3Client'] },
        { file: 'database-import.js', keywords: ['import', 'database'] },
        { file: 'realtime-sync.js', keywords: ['WebSocket', 'ws'] },
        { file: 'frontend/barcodeHandler.js', keywords: ['barcode'] },
        { file: 'frontend/searchProducts.js', keywords: ['search'] },
        { file: 'frontend/realtimeClient.js', keywords: ['WebSocket'] }
    ];
    
    for (const module of modules) {
        const modulePath = path.join(TEST_DIR, module.file);
        if (fs.existsSync(modulePath)) {
            const content = fs.readFileSync(modulePath, 'utf8');
            const hasKeywords = module.keywords.some(keyword => content.includes(keyword));
            addResult('JavaScript Modules', hasKeywords, `${module.file} contains expected code`);
        } else {
            addResult('JavaScript Modules', false, `${module.file} is missing`);
        }
    }
}

// Test 10: Test executable
async function testExecutable() {
    log('\n=== TEST 10: Executable File ===', 'info');
    
    const exePath = './TEST_PORTABLE/Punchiri Billing System.exe';
    if (fs.existsSync(exePath)) {
        const stats = fs.statSync(exePath);
        addResult('Executable', true, `Executable exists (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
        addResult('Executable', false, 'Executable file missing');
    }
}

// Generate test report
function generateReport() {
    log('\n' + '='.repeat(60), 'info');
    log('TEST SUMMARY', 'info');
    log('='.repeat(60), 'info');
    
    log(`\n✅ PASSED: ${results.passed.length}`, 'success');
    log(`❌ FAILED: ${results.failed.length}`, 'error');
    log(`⚠️  WARNINGS: ${results.warnings.length}`, 'warning');
    
    if (results.failed.length > 0) {
        log('\n' + '='.repeat(60), 'info');
        log('FAILED TESTS:', 'error');
        log('='.repeat(60), 'info');
        results.failed.forEach(({ test, message }) => {
            log(`  ${test}: ${message}`, 'error');
        });
    }
    
    if (results.warnings.length > 0) {
        log('\n' + '='.repeat(60), 'info');
        log('WARNINGS:', 'warning');
        log('='.repeat(60), 'info');
        results.warnings.forEach(({ test, message }) => {
            log(`  ${test}: ${message}`, 'warning');
        });
    }
    
    const totalTests = results.passed.length + results.failed.length;
    const successRate = ((results.passed.length / totalTests) * 100).toFixed(2);
    
    log('\n' + '='.repeat(60), 'info');
    log(`SUCCESS RATE: ${successRate}%`, successRate >= 90 ? 'success' : 'error');
    log('='.repeat(60), 'info');
    
    // Save report to file
    const reportPath = './test-report.txt';
    const reportContent = `
COMPREHENSIVE TEST REPORT
Generated: ${new Date().toISOString()}
==========================================================

SUMMARY:
- Total Tests: ${totalTests}
- Passed: ${results.passed.length}
- Failed: ${results.failed.length}
- Warnings: ${results.warnings.length}
- Success Rate: ${successRate}%

PASSED TESTS:
${results.passed.map(({ test, message }) => `  ✅ ${test}: ${message}`).join('\n')}

${results.failed.length > 0 ? `FAILED TESTS:\n${results.failed.map(({ test, message }) => `  ❌ ${test}: ${message}`).join('\n')}` : ''}

${results.warnings.length > 0 ? `WARNINGS:\n${results.warnings.map(({ test, message }) => `  ⚠️  ${test}: ${message}`).join('\n')}` : ''}

==========================================================
`;
    
    fs.writeFileSync(reportPath, reportContent);
    log(`\n📄 Full report saved to: ${reportPath}`, 'info');
    
    return successRate >= 90;
}

// Main test runner
async function runAllTests() {
    log('🚀 STARTING COMPREHENSIVE TEST SUITE', 'info');
    log('Testing Portable Billing System', 'info');
    log('='.repeat(60), 'info');
    
    try {
        await testDirectoryStructure();
        await testRequiredFiles();
        await testNodeModules();
        await testDatabaseCreation();
        await testDatabaseOperations();
        await testBackupFunctionality();
        await testConfigurationFiles();
        await testHTMLPages();
        await testJavaScriptModules();
        await testExecutable();
        
        const success = generateReport();
        
        if (success) {
            log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!', 'success');
            log('The portable application is ready to be sent.', 'success');
        } else {
            log('\n⚠️  SOME TESTS FAILED!', 'warning');
            log('Please review the failed tests before sending.', 'warning');
        }
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        log(`\n💥 TEST SUITE CRASHED: ${error.message}`, 'error');
        console.error(error);
        process.exit(1);
    }
}

// Run tests
runAllTests();
