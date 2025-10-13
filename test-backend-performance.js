#!/usr/bin/env node

// Use native fetch (available in Node.js 18+)

// Test payload from the frontend
const generateUniquePayload = () => ({
  "name": `TestProject_${Date.now()}`,
  "description": "Performance test project",
  "type": "vpc",
  "tenant_id": null,
  "client_ids": [],
  "default_region": "lagos-1"
});

// API endpoint
const API_URL = 'https://unicloud.magicwallet.app/admin/v1/projects';

// Bearer token (you'll need to replace this with a valid token)
const BEARER_TOKEN = '13|Md0LYMWxsowfPO53EG6le3yIICyXJbaeFLKF70uCc1fbf9ef';

async function testProjectCreation() {
  console.log('🚀 Starting backend performance test...\n');
  
  const testPayload = generateUniquePayload();
  const startTime = Date.now();
  
  try {
    console.log('📦 Test Payload:', JSON.stringify(testPayload, null, 2));
    console.log('\n⏳ Sending request to:', API_URL);
    console.log('🔑 Using Bearer token:', BEARER_TOKEN.substring(0, 10) + '...\n');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'User-Agent': 'UniCloud-Performance-Test/1.0'
      },
      body: JSON.stringify(testPayload)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ Response Time: ${responseTime}ms`);
    console.log(`🔥 Status: ${response.status} ${response.statusText}`);
    
    // Categorize response time
    if (responseTime < 1000) {
      console.log('✅ Response time is EXCELLENT (< 1s)');
    } else if (responseTime < 3000) {
      console.log('⚠️ Response time is ACCEPTABLE (1-3s)');
    } else if (responseTime < 10000) {
      console.log('🐌 Response time is SLOW (3-10s)');
    } else {
      console.log('🚨 Response time is VERY SLOW (>10s)');
    }
    
    // Get response body
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
      console.log('\n📄 Response Body:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('\n📄 Raw Response:', responseText);
    }
    
    // Analysis
    console.log('\n📊 Performance Analysis:');
    console.log('='.repeat(50));
    
    if (response.ok) {
      console.log('✅ Request successful');
      if (responseTime > 5000) {
        console.log('⚠️ ISSUE: Response took longer than 5 seconds');
        console.log('   This indicates potential backend performance issues:');
        console.log('   - Database query optimization needed');
        console.log('   - Infrastructure provisioning delays');
        console.log('   - Network latency issues');
        console.log('   - Server resource constraints');
      }
    } else {
      console.log('❌ Request failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${responseData?.message || responseText}`);
    }
    
    return { success: response.ok, responseTime, status: response.status, data: responseData };
    
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`❌ Request failed after ${responseTime}ms`);
    console.log('🔥 Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🌐 Server is not reachable');
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.log('⏰ Request timed out - server is very slow or unresponsive');
    } else if (error.message.includes('fetch')) {
      console.log('🌐 Network connectivity issue');
    }
    
    return { success: false, responseTime, error: error.message };
  }
}

async function runMultipleTests(count = 3) {
  console.log(`🧪 Running ${count} test(s) to measure consistency...\n`);
  
  const results = [];
  
  for (let i = 1; i <= count; i++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 TEST ${i}/${count}`);
    console.log(`${'='.repeat(60)}`);
    
    const result = await testProjectCreation();
    results.push(result);
    
    // Wait 2 seconds between tests
    if (i < count) {
      console.log('\n⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📈 SUMMARY');
  console.log(`${'='.repeat(60)}`);
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  const responseTimes = results.map(r => r.responseTime);
  
  console.log(`✅ Successful: ${successfulTests.length}/${count}`);
  console.log(`❌ Failed: ${failedTests.length}/${count}`);
  
  if (responseTimes.length > 0) {
    const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`⏱️ Average Response Time: ${avgResponseTime}ms`);
    console.log(`⚡ Fastest: ${minResponseTime}ms`);
    console.log(`🐌 Slowest: ${maxResponseTime}ms`);
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (responseTimes.some(t => t > 10000)) {
    console.log('🚨 CRITICAL: Some requests took over 10 seconds');
    console.log('   - Check backend server resources (CPU, Memory)');
    console.log('   - Review database query performance');
    console.log('   - Consider implementing request queuing');
    console.log('   - Add server-side caching');
  } else if (responseTimes.some(t => t > 5000)) {
    console.log('⚠️ WARNING: Some requests took over 5 seconds');
    console.log('   - Optimize database queries');
    console.log('   - Review infrastructure provisioning process');
    console.log('   - Consider async processing for heavy operations');
  } else {
    console.log('✅ Performance appears acceptable');
  }
}

// Run the tests
if (require.main === module) {
  runMultipleTests(3).catch(console.error);
}

module.exports = { testProjectCreation, runMultipleTests };