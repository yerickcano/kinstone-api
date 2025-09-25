#!/usr/bin/env node

/**
 * Simple API test script to verify routes are working
 * Run with: node test-api.js (after starting the dev server)
 */

const baseUrl = 'http://localhost:3000/api/v1';

async function testAPI() {
  console.log('🧪 Testing Kinstone API Routes\n');

  const tests = [
    {
      name: 'GET /api/v1/users',
      method: 'GET',
      url: `${baseUrl}/users`,
      expectedStatus: 200
    },
    {
      name: 'GET /api/v1/pieces',
      method: 'GET', 
      url: `${baseUrl}/pieces`,
      expectedStatus: 200
    },
    {
      name: 'POST /api/v1/users (create user)',
      method: 'POST',
      url: `${baseUrl}/users`,
      body: {
        handle: 'testuser',
        display_name: 'Test User',
        inventory_capacity: 50
      },
      expectedStatus: 201
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      const data = await response.json();

      if (response.status === test.expectedStatus) {
        console.log(`✅ PASS - Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...\n`);
      } else {
        console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data)}\n`);
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}\n`);
    }
  }
}

// Check if server is running
fetch('http://localhost:3000')
  .then(() => {
    console.log('✅ Server is running, starting API tests...\n');
    testAPI();
  })
  .catch(() => {
    console.log('❌ Server not running. Please start with: yarn dev\n');
    console.log('Then run this test again: node test-api.js');
  });
