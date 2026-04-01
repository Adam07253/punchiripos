// Quick test script to verify the export endpoint
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/bills/all-for-export',
  method: 'GET'
};

console.log('Testing endpoint: http://localhost:3000/bills/all-for-export');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const bills = JSON.parse(data);
      console.log(`✓ Success! Received ${bills.length} bills`);
      
      if (bills.length > 0) {
        console.log('\nFirst bill sample:');
        console.log('- Bill ID:', bills[0].id);
        console.log('- Date:', bills[0].date);
        console.log('- Items:', bills[0].items ? bills[0].items.length : 0);
        
        if (bills[0].items && bills[0].items.length > 0) {
          console.log('\nFirst item sample:');
          console.log('- Product:', bills[0].items[0].name);
          console.log('- Qty:', bills[0].items[0].qty);
          console.log('- Price:', bills[0].items[0].price);
        }
      }
    } catch (e) {
      console.error('✗ Failed to parse response:', e.message);
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('✗ Request failed:', error.message);
  console.log('\nPossible issues:');
  console.log('1. Server is not running (run: node server.js)');
  console.log('2. Server is running on a different port');
  console.log('3. Endpoint not yet added (restart server)');
});

req.end();
