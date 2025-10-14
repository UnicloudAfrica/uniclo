#!/usr/bin/env node
/**
 * API Response Testing Script
 * 
 * This script tests all backend endpoints and documents their response structures.
 * Use this to understand what data the backend returns and build the UI accordingly.
 * 
 * Usage:
 *   node scripts/test-api-responses.js
 *   node scripts/test-api-responses.js --endpoint=/api/v1/calculator-options
 *   node scripts/test-api-responses.js --save-responses
 */

const fs = require('fs');
const path = require('path');

// Backend configuration
const API_BASE_URL = process.env.REACT_APP_API_USER_BASE_URL || 'http://localhost:8000';
const OUTPUT_DIR = path.join(__dirname, '../api-responses');

// Test credentials (update these with your test account)
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@test.com',
    password: 'password'
  },
  tenant: {
    email: 'tenant@test.com',
    password: 'password'
  },
  client: {
    email: 'client@test.com',
    password: 'password'
  }
};

// Store tokens after login
const tokens = {
  admin: null,
  tenant: null,
  client: null
};

/**
 * Make HTTP request
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { 
        raw: await response.text(),
        note: 'Non-JSON response'
      };
    }

    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      data
    };
  } catch (error) {
    return {
      error: true,
      message: error.message,
      stack: error.stack
    };
  }
}

/**
 * Login and get auth tokens
 */
async function login(context = 'admin') {
  console.log(`\n📝 Logging in as ${context}...`);
  
  const endpoints = {
    admin: '/admin/v1/login',
    tenant: '/tenant/v1/login',
    client: '/api/v1/auth/login'
  };

  const response = await makeRequest(endpoints[context], {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS[context])
  });

  if (response.ok && response.data.token) {
    tokens[context] = response.data.token;
    console.log(`✅ ${context} login successful`);
    return response.data.token;
  } else {
    console.log(`❌ ${context} login failed:`, response.data?.message || response.error);
    return null;
  }
}

/**
 * Test public endpoints (no auth required)
 */
async function testPublicEndpoints() {
  console.log('\n\n🌍 Testing Public Endpoints\n' + '='.repeat(50));
  
  const publicEndpoints = [
    { path: '/api/v1/calculator-options', name: 'Calculator Options' },
    { path: '/api/v1/product-pricing', name: 'Product Pricing' },
    { path: '/api/v1/product-bandwidth', name: 'Product Bandwidth' },
    { path: '/api/v1/product-os-image', name: 'OS Images' },
    { path: '/api/v1/product-compute-instance', name: 'Compute Instances' },
    { path: '/api/v1/product-volume-type', name: 'Volume Types' },
    { path: '/api/v1/product-cross-connect', name: 'Cross Connect' },
    { path: '/api/v1/product-floating-ip', name: 'Floating IPs' },
    { path: '/api/v1/countries', name: 'Countries' },
    { path: '/api/v1/industries', name: 'Industries' }
  ];

  const results = {};

  for (const endpoint of publicEndpoints) {
    console.log(`\nTesting: ${endpoint.name} (${endpoint.path})`);
    const response = await makeRequest(endpoint.path);
    
    results[endpoint.path] = {
      name: endpoint.name,
      status: response.status,
      ok: response.ok,
      hasData: !!response.data,
      dataStructure: analyzeStructure(response.data),
      sampleData: getSampleData(response.data)
    };

    if (response.ok) {
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  📊 Data type: ${typeof response.data}`);
      if (Array.isArray(response.data)) {
        console.log(`  📊 Array length: ${response.data.length}`);
      } else if (response.data?.data) {
        console.log(`  📊 Has data property:`, typeof response.data.data);
      }
    } else {
      console.log(`  ❌ Status: ${response.status} - ${response.data?.message || 'Error'}`);
    }
  }

  return results;
}

/**
 * Test admin endpoints (requires admin auth)
 */
async function testAdminEndpoints() {
  console.log('\n\n👨‍💼 Testing Admin Endpoints\n' + '='.repeat(50));

  // Login as admin first
  const token = await login('admin');
  if (!token) {
    console.log('❌ Cannot test admin endpoints without valid token');
    return {};
  }

  const adminEndpoints = [
    { path: '/admin/v1/admins', name: 'Admin Users', method: 'GET' },
    { path: '/admin/v1/clients', name: 'Clients List', method: 'GET' },
    { path: '/admin/v1/projects', name: 'Projects List', method: 'GET' },
    { path: '/admin/v1/instances', name: 'Instances List', method: 'GET' },
    { path: '/admin/v1/regions', name: 'Regions', method: 'GET' },
    { path: '/admin/v1/product-pricing', name: 'Admin Product Pricing', method: 'GET' },
    { path: '/admin/v1/leads', name: 'Leads', method: 'GET' },
    { path: '/admin/v1/sub-tenants', name: 'Sub Tenants', method: 'GET' }
  ];

  const results = {};

  for (const endpoint of adminEndpoints) {
    console.log(`\nTesting: ${endpoint.name} (${endpoint.path})`);
    const response = await makeRequest(endpoint.path, {
      method: endpoint.method,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    results[endpoint.path] = {
      name: endpoint.name,
      status: response.status,
      ok: response.ok,
      hasData: !!response.data,
      dataStructure: analyzeStructure(response.data),
      sampleData: getSampleData(response.data)
    };

    if (response.ok) {
      console.log(`  ✅ Status: ${response.status}`);
      displayDataSummary(response.data);
    } else {
      console.log(`  ❌ Status: ${response.status} - ${response.data?.message || 'Error'}`);
    }
  }

  return results;
}

/**
 * Test business/client endpoints (requires client auth)
 */
async function testBusinessEndpoints() {
  console.log('\n\n💼 Testing Business/Client Endpoints\n' + '='.repeat(50));

  const token = await login('client');
  if (!token) {
    console.log('❌ Cannot test business endpoints without valid token');
    return {};
  }

  const businessEndpoints = [
    { path: '/api/v1/business/profile', name: 'Business Profile' },
    { path: '/api/v1/business/projects', name: 'Projects' },
    { path: '/api/v1/business/instances', name: 'Instances' },
    { path: '/api/v1/business/key-pairs', name: 'Key Pairs' },
    { path: '/api/v1/business/security-groups', name: 'Security Groups' },
    { path: '/api/v1/business/vpcs', name: 'VPCs' },
    { path: '/api/v1/business/subnets', name: 'Subnets' },
    { path: '/api/v1/business/volumes', name: 'Volumes' },
    { path: '/api/v1/business/elastic-ips', name: 'Elastic IPs' }
  ];

  const results = {};

  for (const endpoint of businessEndpoints) {
    console.log(`\nTesting: ${endpoint.name} (${endpoint.path})`);
    const response = await makeRequest(endpoint.path, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    results[endpoint.path] = {
      name: endpoint.name,
      status: response.status,
      ok: response.ok,
      hasData: !!response.data,
      dataStructure: analyzeStructure(response.data),
      sampleData: getSampleData(response.data)
    };

    if (response.ok) {
      console.log(`  ✅ Status: ${response.status}`);
      displayDataSummary(response.data);
    } else {
      console.log(`  ❌ Status: ${response.status} - ${response.data?.message || 'Error'}`);
    }
  }

  return results;
}

/**
 * Analyze data structure
 */
function analyzeStructure(data) {
  if (!data) return 'null';
  if (Array.isArray(data)) {
    return {
      type: 'array',
      length: data.length,
      itemStructure: data.length > 0 ? analyzeStructure(data[0]) : 'empty'
    };
  }
  if (typeof data === 'object') {
    const structure = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        structure[key] = typeof data[key];
        if (Array.isArray(data[key]) && data[key].length > 0) {
          structure[key] = `array[${data[key].length}]`;
        }
      }
    }
    return structure;
  }
  return typeof data;
}

/**
 * Get sample data (first few items)
 */
function getSampleData(data, maxItems = 2) {
  if (Array.isArray(data)) {
    return data.slice(0, maxItems);
  }
  if (typeof data === 'object' && data !== null) {
    if (data.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.slice(0, maxItems)
      };
    }
  }
  return data;
}

/**
 * Display data summary
 */
function displayDataSummary(data) {
  if (Array.isArray(data)) {
    console.log(`  📊 Array with ${data.length} items`);
    if (data.length > 0) {
      console.log(`  📋 First item keys:`, Object.keys(data[0]).join(', '));
    }
  } else if (data?.data && Array.isArray(data.data)) {
    console.log(`  📊 Response with data array: ${data.data.length} items`);
    if (data.data.length > 0) {
      console.log(`  📋 First item keys:`, Object.keys(data.data[0]).join(', '));
    }
    if (data.meta) {
      console.log(`  📄 Has pagination meta:`, JSON.stringify(data.meta));
    }
  } else if (typeof data === 'object') {
    console.log(`  📋 Object keys:`, Object.keys(data).join(', '));
  }
}

/**
 * Save results to file
 */
function saveResults(results, filename) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${filepath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 UniCloud API Response Testing Tool');
  console.log('=====================================');
  console.log(`📍 Backend URL: ${API_BASE_URL}\n`);

  const args = process.argv.slice(2);
  const shouldSave = args.includes('--save-responses');
  const specificEndpoint = args.find(arg => arg.startsWith('--endpoint='));

  if (specificEndpoint) {
    const endpoint = specificEndpoint.split('=')[1];
    console.log(`Testing specific endpoint: ${endpoint}`);
    const response = await makeRequest(endpoint);
    console.log(JSON.stringify(response, null, 2));
    return;
  }

  const allResults = {
    timestamp: new Date().toISOString(),
    baseUrl: API_BASE_URL,
    public: {},
    admin: {},
    business: {}
  };

  // Test all endpoint categories
  allResults.public = await testPublicEndpoints();
  allResults.admin = await testAdminEndpoints();
  allResults.business = await testBusinessEndpoints();

  // Generate summary
  console.log('\n\n📊 Test Summary\n' + '='.repeat(50));
  
  const countResults = (results) => {
    const total = Object.keys(results).length;
    const successful = Object.values(results).filter(r => r.ok).length;
    return { total, successful, failed: total - successful };
  };

  const publicStats = countResults(allResults.public);
  const adminStats = countResults(allResults.admin);
  const businessStats = countResults(allResults.business);

  console.log(`\n📍 Public Endpoints: ${publicStats.successful}/${publicStats.total} successful`);
  console.log(`📍 Admin Endpoints: ${adminStats.successful}/${adminStats.total} successful`);
  console.log(`📍 Business Endpoints: ${businessStats.successful}/${businessStats.total} successful`);
  
  const totalSuccess = publicStats.successful + adminStats.successful + businessStats.successful;
  const totalTests = publicStats.total + adminStats.total + businessStats.total;
  console.log(`\n✅ Total: ${totalSuccess}/${totalTests} endpoints working`);

  if (shouldSave) {
    saveResults(allResults, `api-responses-${Date.now()}.json`);
    
    // Also save a markdown report
    const mdReport = generateMarkdownReport(allResults);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'API_TEST_REPORT.md'),
      mdReport
    );
    console.log('📄 Markdown report saved to: api-responses/API_TEST_REPORT.md');
  }

  console.log('\n✨ Testing complete!\n');
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(results) {
  let md = `# API Test Report\n\n`;
  md += `**Generated:** ${results.timestamp}\n\n`;
  md += `**Backend URL:** ${results.baseUrl}\n\n`;
  md += `---\n\n`;

  const sections = [
    { title: 'Public Endpoints', data: results.public },
    { title: 'Admin Endpoints', data: results.admin },
    { title: 'Business Endpoints', data: results.business }
  ];

  sections.forEach(section => {
    md += `## ${section.title}\n\n`;
    md += `| Endpoint | Name | Status | Has Data | Structure |\n`;
    md += `|----------|------|--------|----------|----------|\n`;

    Object.entries(section.data).forEach(([path, info]) => {
      const statusEmoji = info.ok ? '✅' : '❌';
      const dataEmoji = info.hasData ? '✓' : '✗';
      md += `| \`${path}\` | ${info.name} | ${statusEmoji} ${info.status} | ${dataEmoji} | ${JSON.stringify(info.dataStructure).substring(0, 50)}... |\n`;
    });

    md += `\n`;
  });

  return md;
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeRequest, testPublicEndpoints, testAdminEndpoints, testBusinessEndpoints };
