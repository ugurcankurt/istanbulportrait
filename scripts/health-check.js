const https = require('https')
const fs = require('fs')

const HEALTH_CHECK_CONFIG = {
  endpoints: [
    {
      name: 'Homepage',
      url: 'https://istanbulportrait.com',
      expectedStatus: 200,
      timeout: 10000
    },
    {
      name: 'API Health',
      url: 'https://istanbulportrait.com/api/health',
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'Booking API',
      url: 'https://istanbulportrait.com/api/booking',
      method: 'OPTIONS', // Check CORS preflight
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'Sitemap',
      url: 'https://istanbulportrait.com/sitemap.xml',
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'Robots.txt',
      url: 'https://istanbulportrait.com/robots.txt',
      expectedStatus: 200,
      timeout: 5000
    }
  ],
  external: [
    {
      name: 'Supabase',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      expectedStatus: 200,
      timeout: 5000
    },
    {
      name: 'Iyzico Sandbox',
      url: 'https://sandbox-api.iyzipay.com',
      expectedStatus: 404, // Expected for base URL
      timeout: 5000
    }
  ]
}

function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const url = new URL(endpoint.url)
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: endpoint.method || 'GET',
      timeout: endpoint.timeout || 10000,
      headers: {
        'User-Agent': 'Istanbul Portrait Health Check',
        'Accept': 'text/html,application/json,*/*',
      }
    }

    const req = https.request(options, (res) => {
      const responseTime = Date.now() - startTime
      const success = res.statusCode === endpoint.expectedStatus
      
      resolve({
        name: endpoint.name,
        url: endpoint.url,
        status: res.statusCode,
        expected: endpoint.expectedStatus,
        responseTime,
        success,
        message: success ? 'OK' : `Expected ${endpoint.expectedStatus}, got ${res.statusCode}`
      })
    })

    req.on('timeout', () => {
      const responseTime = Date.now() - startTime
      resolve({
        name: endpoint.name,
        url: endpoint.url,
        status: 'TIMEOUT',
        expected: endpoint.expectedStatus,
        responseTime,
        success: false,
        message: `Request timeout after ${endpoint.timeout}ms`
      })
    })

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime
      resolve({
        name: endpoint.name,
        url: endpoint.url,
        status: 'ERROR',
        expected: endpoint.expectedStatus,
        responseTime,
        success: false,
        message: error.message
      })
    })

    req.end()
  })
}

async function runHealthCheck() {
  console.log('🏥 Istanbul Portrait Health Check')
  console.log('='.repeat(50))
  console.log(`⏰ ${new Date().toISOString()}`)
  
  const allEndpoints = [
    ...HEALTH_CHECK_CONFIG.endpoints,
    ...HEALTH_CHECK_CONFIG.external
  ]
  
  console.log(`\n🔍 Checking ${allEndpoints.length} endpoints...\n`)
  
  const results = await Promise.all(
    allEndpoints.map(endpoint => checkEndpoint(endpoint))
  )
  
  let successCount = 0
  let totalResponseTime = 0
  
  results.forEach(result => {
    const statusIcon = result.success ? '✅' : '❌'
    const responseTimeColor = result.responseTime < 1000 ? '' : result.responseTime < 3000 ? '🟡' : '🔴'
    
    console.log(`${statusIcon} ${result.name}`)
    console.log(`   ${result.url}`)
    console.log(`   Status: ${result.status} (expected: ${result.expected})`)
    console.log(`   Response time: ${responseTimeColor}${result.responseTime}ms`)
    console.log(`   Message: ${result.message}`)
    console.log()
    
    if (result.success) {
      successCount++
      totalResponseTime += result.responseTime
    }
  })
  
  // Summary
  console.log('📊 HEALTH CHECK SUMMARY')
  console.log('='.repeat(30))
  console.log(`✅ Successful: ${successCount}/${results.length}`)
  console.log(`❌ Failed: ${results.length - successCount}/${results.length}`)
  console.log(`⚡ Average response time: ${Math.round(totalResponseTime / successCount)}ms`)
  console.log(`🎯 Overall health: ${successCount === results.length ? '🟢 HEALTHY' : '🔴 ISSUES DETECTED'}`)
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    totalEndpoints: results.length,
    successfulEndpoints: successCount,
    failedEndpoints: results.length - successCount,
    averageResponseTime: Math.round(totalResponseTime / successCount),
    status: successCount === results.length ? 'healthy' : 'unhealthy',
    results: results
  }
  
  // Save report (optional)
  if (process.env.SAVE_HEALTH_REPORTS === 'true') {
    const reportFile = `health-report-${Date.now()}.json`
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(`\n💾 Report saved to: ${reportFile}`)
  }
  
  // Exit code for CI/CD
  process.exit(successCount === results.length ? 0 : 1)
}

// SSL Certificate check
async function checkSSLCertificate(hostname) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port: 443,
      method: 'HEAD',
      timeout: 5000
    }
    
    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate()
      const now = new Date()
      const validFrom = new Date(cert.valid_from)
      const validTo = new Date(cert.valid_to)
      const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24))
      
      resolve({
        valid: cert.valid,
        issuer: cert.issuer.CN,
        validFrom,
        validTo,
        daysUntilExpiry,
        subject: cert.subject.CN
      })
    })
    
    req.on('error', () => {
      resolve({ valid: false, error: 'SSL connection failed' })
    })
    
    req.end()
  })
}

async function sslHealthCheck() {
  console.log('\n🔒 SSL Certificate Health Check')
  console.log('='.repeat(35))
  
  const sslInfo = await checkSSLCertificate('istanbulportrait.com')
  
  if (sslInfo.valid) {
    console.log(`✅ SSL Certificate Valid`)
    console.log(`   Subject: ${sslInfo.subject}`)
    console.log(`   Issuer: ${sslInfo.issuer}`)
    console.log(`   Valid from: ${sslInfo.validFrom.toISOString().split('T')[0]}`)
    console.log(`   Valid until: ${sslInfo.validTo.toISOString().split('T')[0]}`)
    console.log(`   Days until expiry: ${sslInfo.daysUntilExpiry}`)
    
    if (sslInfo.daysUntilExpiry < 30) {
      console.log('⚠️ WARNING: Certificate expires in less than 30 days!')
    }
  } else {
    console.log(`❌ SSL Certificate Invalid: ${sslInfo.error}`)
  }
}

// Performance check
async function performanceCheck() {
  console.log('\n⚡ Performance Check')
  console.log('='.repeat(20))
  
  const performanceMetrics = []
  const testUrls = [
    'https://istanbulportrait.com',
    'https://istanbulportrait.com/packages',
    'https://istanbulportrait.com/about'
  ]
  
  for (const url of testUrls) {
    const startTime = Date.now()
    try {
      const result = await checkEndpoint({ 
        name: url, 
        url, 
        expectedStatus: 200, 
        timeout: 10000 
      })
      
      performanceMetrics.push({
        url,
        responseTime: result.responseTime,
        success: result.success
      })
      
      const grade = result.responseTime < 500 ? 'A' : 
                   result.responseTime < 1000 ? 'B' :
                   result.responseTime < 2000 ? 'C' : 'D'
      
      console.log(`${grade} ${url}: ${result.responseTime}ms`)
      
    } catch (error) {
      console.log(`F ${url}: Error - ${error.message}`)
    }
  }
  
  const avgResponseTime = performanceMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / performanceMetrics.length
  console.log(`\n📊 Average response time: ${Math.round(avgResponseTime)}ms`)
  console.log(`🎯 Performance grade: ${avgResponseTime < 500 ? 'A (Excellent)' : avgResponseTime < 1000 ? 'B (Good)' : avgResponseTime < 2000 ? 'C (Fair)' : 'D (Poor)'}`)
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--ssl-only')) {
    await sslHealthCheck()
  } else if (args.includes('--performance-only')) {
    await performanceCheck()
  } else {
    await runHealthCheck()
    await sslHealthCheck()
    await performanceCheck()
  }
}

if (require.main === module) {
  main()
}

module.exports = { runHealthCheck, checkSSLCertificate, performanceCheck }