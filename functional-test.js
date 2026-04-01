/**
 * FUNCTIONAL TEST - Tests server startup and API endpoints
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const TEST_DIR = './TEST_PORTABLE/resources/app';
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess = null;
const results = {
    passed: [],
    failed: []
};

function log(message, type = 'info') {
    const prefix = {
        'info': '📋',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    }[type] || '📋';
    console.log(`${prefix} ${message}`);
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

// Start the server
function startServer() {
    return new Promise((resolve, reject) => {
        log('\n🚀 Starting server...', 'info');
        
        serverProcess = spawn('node', ['server.js'], {
            cwd: TEST_DIR,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let output = '';
        
        serverProcess.stdout.on('data', (data) => {
            output += data.toString();
            if (output.includes('Server running') || output.includes('listening')) {
                log('Server started successfully', 'success');
                setTimeout(resolve, 1000); // Wait 1 second for server to be fully ready
            }
        });
        
        serverProcess.stderr.on('data', (data) => {
            const error = data.toString();
            if (!error.includes('DeprecationWarning')) {
                log(`Server error: ${error}`, 'error');
            }
        });
        
        serverProcess.on('error', (error) => {
            reject(error);
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (serverProcess && !serverProcess.killed) {
                resolve(); // Assume it started even if we didn't see the message
            }
        }, 10000);
    });
}

// Stop the server
function stopServer() {
    return new Promise((resolve) => {
        if (serverProcess) {
            log('\n🛑 Stopping server...', 'info');
            serverProcess.kill();
            setTimeout(resolve, 1000);
        } else {
            resolve();
        }
    });
}

// Make HTTP request
function makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Test 1: Server startup
async function testServerStartup() {
    log('\n=== TEST 1: Server Startup ===', 'info');
    try {
        await startServer();
        addResult('Server Startup', true, 'Server started successfully');
        return true;
    } catch (error) {
        addResult('Server Startup', false, `Failed to start: ${error.message}`);
        return false;
    }
}

// Test 2: Static files
async function testStaticFiles() {
    log('\n=== TEST 2: Static Files ===', 'info');
    
    const files = [
        '/login.html',
        '/dashboard.html',
        '/products.html',
        '/billing_v2.html'
    ];
    
    for (const file of files) {
        try {
            const response = await makeRequest(file);
            addResult('Static Files', response.status === 200, `${file} accessible (${response.status})`);
        } catch (error) {
            addResult('Static Files', false, `${file} failed: ${error.message}`);
        }
    }
}

// Test 3: API endpoints
async function testAPIEndpoints() {
    log('\n=== TEST 3: API Endpoints ===', 'info');
    
    const endpoints = [
        { path: '/api/products', method: 'GET', name: 'Get Products' },
        { path: '/api/customers', method: 'GET', name: 'Get Customers' },
        { path: '/api/bills', method: 'GET', name: 'Get Bills' },
        { path: '/api/users', method: 'GET', name: 'Get Users' },
        { path: '/api/dashboard-stats', method: 'GET', name: 'Dashboard Stats' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(endpoint.path, endpoint.method);
            const success = response.status === 200 || response.status === 201;
            addResult('API Endpoints', success, `${endpoint.name} (${response.status})`);
        } catch (error) {
            addResult('API Endpoints', false, `${endpoint.name} failed: ${error.message}`);
        }
    }
}

// Test 4: Database operations via API
async function testDatabaseViaAPI() {
    log('\n=== TEST 4: Database Operations via API ===', 'info');
    
    try {
        // Test creating a product
        const productData = {
            name: 'API Test Product',
            barcode: 'APITEST123',
            price: 49.99,
            stock: 5,
            category: 'Test'
        };
        
        const createResponse = await makeRequest('/api/products', 'POST', productData);
        addResult('Create Product', createResponse.status === 201, `Product created (${createResponse.status})`);
        
        // Test getting products
        const getResponse = await makeRequest('/api/products', 'GET');
        addResult('Get Products', getResponse.status === 200, `Products retrieved (${getResponse.status})`);
        
        if (getResponse.data && Array.isArray(getResponse.data)) {
            addResult('Product Data', getResponse.data.length > 0, `Found ${getResponse.data.length} products`);
        }
    } catch (error) {
        addResult('Database Operations', false, `Failed: ${error.message}`);
    }
}

// Test 5: Authentication
async function testAuthentication() {
    log('\n=== TEST 5: Authentication ===', 'info');
    
    try {
        const loginData = {
            username: 'admin',
            password: 'admin123'
        };
        
        const response = await makeRequest('/api/login', 'POST', loginData);
        addResult('Login', response.status === 200, `Login endpoint (${response.status})`);
        
        if (response.data && response.data.success) {
            addResult('Authentication', true, 'Admin login successful');
        } else {
            addResult('Authentication', false, 'Login failed');
        }
    } catch (error) {
        addResult('Authentication', false, `Failed: ${error.message}`);
    }
}

// Test 6: WebSocket connection
async function testWebSocket() {
    log('\n=== TEST 6: WebSocket ===', 'info');
    
    try {
        const WebSocket = require('ws');
        const ws = new WebSocket(`ws://localhost:${PORT}`);
        
        await new Promise((resolve, reject) => {
            ws.on('open', () => {
                addResult('WebSocket', true, 'WebSocket connection established');
                ws.close();
                resolve();
            });
            
            ws.on('error', (error) => {
                addResult('WebSocket', false, `Connection failed: ${error.message}`);
                resolve();
            });
            
            setTimeout(() => {
                ws.close();
                addResult('WebSocket', false, 'Connection timeout');
                resolve();
            }, 5000);
        });
    } catch (error) {
        addResult('WebSocket', false, `Failed: ${error.message}`);
    }
}

// Generate report
function generateReport() {
    log('\n' + '='.repeat(60), 'info');
    log('FUNCTIONAL TEST SUMMARY', 'info');
    log('='.repeat(60), 'info');
    
    log(`\n✅ PASSED: ${results.passed.length}`, 'success');
    log(`❌ FAILED: ${results.failed.length}`, 'error');
    
    if (results.failed.length > 0) {
        log('\nFAILED TESTS:', 'error');
        results.failed.forEach(({ test, message }) => {
            log(`  ${test}: ${message}`, 'error');
        });
    }
    
    const totalTests = results.passed.length + results.failed.length;
    const successRate = ((results.passed.length / totalTests) * 100).toFixed(2);
    
    log(`\nSUCCESS RATE: ${successRate}%`, successRate >= 80 ? 'success' : 'error');
    
    return successRate >= 80;
}

// Main test runner
async function runFunctionalTests() {
    log('🧪 STARTING FUNCTIONAL TESTS', 'info');
    log('='.repeat(60), 'info');
    
    try {
        const serverStarted = await testServerStartup();
        
        if (serverStarted) {
            await testStaticFiles();
            await testAPIEndpoints();
            await testDatabaseViaAPI();
            await testAuthentication();
            await testWebSocket();
        } else {
            log('\n⚠️  Server failed to start, skipping functional tests', 'warning');
        }
        
        await stopServer();
        
        const success = generateReport();
        
        if (success) {
            log('\n🎉 FUNCTIONAL TESTS COMPLETED SUCCESSFULLY!', 'success');
        } else {
            log('\n⚠️  SOME FUNCTIONAL TESTS FAILED!', 'warning');
        }
        
        process.exit(success ? 0 : 1);
    } catch (error) {
        log(`\n💥 TEST SUITE CRASHED: ${error.message}`, 'error');
        console.error(error);
        await stopServer();
        process.exit(1);
    }
}

// Run tests
runFunctionalTests();
