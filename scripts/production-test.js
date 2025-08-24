const { runHealthCheck } = require('./health-check')
const { testDatabase } = require('./test-db')
const { testPaymentAPI } = require('./test-payment')
require('dotenv').config()

async function testEnvironmentVariables() {
  console.log('🔍 Environment Variables Test')
  console.log('='.repeat(30))
  
  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase database URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key',
    'SUPABASE_SERVICE_KEY': 'Supabase service role key',
    'IYZICO_BASE_URL': 'Iyzico API base URL',
    'IYZICO_API_KEY': 'Iyzico API key', 
    'IYZICO_SECRET_KEY': 'Iyzico secret key'
  }
  
  const optionalVars = {
    'NEXT_PUBLIC_GOOGLE_ANALYTICS_ID': 'Google Analytics measurement ID',
    'RESEND_API_KEY': 'Email service API key',
    'CONTACT_EMAIL': 'Business contact email'
  }
  
  let criticalMissing = 0
  let optionalMissing = 0
  
  console.log('\n✅ Required Variables:')
  Object.entries(requiredVars).forEach(([key, description]) => {
    const value = process.env[key]
    if (!value) {
      console.log(`❌ ${key}: Missing - ${description}`)
      criticalMissing++
    } else if (value.includes('your-') || value.includes('demo-')) {
      console.log(`⚠️ ${key}: Placeholder value - ${description}`)
    } else {
      console.log(`✅ ${key}: Configured`)
    }
  })
  
  console.log('\n📋 Optional Variables:')
  Object.entries(optionalVars).forEach(([key, description]) => {
    const value = process.env[key]
    if (!value) {
      console.log(`⚪ ${key}: Not set - ${description}`)
      optionalMissing++
    } else {
      console.log(`✅ ${key}: Configured`)
    }
  })
  
  const summary = {
    critical: criticalMissing === 0,
    criticalMissing,
    optionalMissing,
    readyForProduction: criticalMissing === 0
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`Critical missing: ${criticalMissing}`)
  console.log(`Optional missing: ${optionalMissing}`)
  console.log(`Production ready: ${summary.readyForProduction ? '✅ YES' : '❌ NO'}`)
  
  return summary
}

async function testBuildProcess() {
  console.log('\n🔨 Build Process Test')
  console.log('='.repeat(20))
  
  const { spawn } = require('child_process')
  
  return new Promise((resolve) => {
    console.log('🔄 Running production build...')
    const build = spawn('npm', ['run', 'build'], { stdio: 'pipe' })
    
    let output = ''
    let errorOutput = ''
    
    build.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    build.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    build.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build successful')
        console.log('📊 Build output summary:')
        
        // Parse build output for insights
        if (output.includes('Route (app)')) {
          console.log('✅ App Router pages compiled')
        }
        if (output.includes('○ Static')) {
          console.log('✅ Static pages generated')
        }
        if (output.includes('λ Server')) {
          console.log('✅ Server-side pages configured')
        }
        
        resolve({ success: true, output })
      } else {
        console.log('❌ Build failed')
        console.log('Error output:', errorOutput)
        resolve({ success: false, error: errorOutput })
      }
    })
  })
}

async function testTypeScript() {
  console.log('\n📝 TypeScript Check')
  console.log('='.repeat(20))
  
  const { spawn } = require('child_process')
  
  return new Promise((resolve) => {
    const typeCheck = spawn('npm', ['run', 'type-check'], { stdio: 'pipe' })
    
    let output = ''
    let errorOutput = ''
    
    typeCheck.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    typeCheck.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    typeCheck.on('close', (code) => {
      if (code === 0) {
        console.log('✅ No TypeScript errors')
        resolve({ success: true })
      } else {
        console.log('❌ TypeScript errors found')
        console.log(errorOutput)
        resolve({ success: false, errors: errorOutput })
      }
    })
  })
}

async function testLinting() {
  console.log('\n🔍 Code Quality Check')
  console.log('='.repeat(20))
  
  const { spawn } = require('child_process')
  
  return new Promise((resolve) => {
    const lint = spawn('npm', ['run', 'lint'], { stdio: 'pipe' })
    
    let output = ''
    let errorOutput = ''
    
    lint.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    lint.stderr.on('data', (data) => {
      errorOutput += data.toString()
    })
    
    lint.on('close', (code) => {
      if (code === 0) {
        console.log('✅ No linting errors')
        resolve({ success: true })
      } else {
        console.log('❌ Linting errors found')
        console.log(errorOutput)
        resolve({ success: false, errors: errorOutput })
      }
    })
  })
}

async function testInternationalization() {
  console.log('\n🌍 Internationalization Test')
  console.log('='.repeat(25))
  
  const fs = require('fs')
  const path = require('path')
  
  const messageDir = path.join(process.cwd(), 'messages')
  const locales = ['en', 'ar', 'ru', 'es']
  
  let allValid = true
  const results = {}
  
  for (const locale of locales) {
    const filePath = path.join(messageDir, `${locale}.json`)
    
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`❌ ${locale}.json: File missing`)
        allValid = false
        continue
      }
      
      const content = fs.readFileSync(filePath, 'utf8')
      const messages = JSON.parse(content)
      
      // Count keys
      const keyCount = JSON.stringify(messages).split('":').length - 1
      
      console.log(`✅ ${locale}.json: ${keyCount} translation keys`)
      results[locale] = { valid: true, keyCount }
      
    } catch (error) {
      console.log(`❌ ${locale}.json: Invalid JSON - ${error.message}`)
      allValid = false
      results[locale] = { valid: false, error: error.message }
    }
  }
  
  // Check key consistency between locales
  if (allValid) {
    const keyCounts = Object.values(results).map(r => r.keyCount)
    const consistent = keyCounts.every(count => count === keyCounts[0])
    
    if (consistent) {
      console.log('✅ All locales have consistent key counts')
    } else {
      console.log('⚠️ Inconsistent translation key counts between locales')
      allValid = false
    }
  }
  
  return { success: allValid, results }
}

async function testSEOConfiguration() {
  console.log('\n🔍 SEO Configuration Test')
  console.log('='.repeat(25))
  
  const fs = require('fs')
  const path = require('path')
  
  // Check for required SEO files
  const seoChecks = [
    { file: 'app/robots.ts', description: 'Robots.txt generator' },
    { file: 'app/sitemap.ts', description: 'Sitemap generator' },
    { file: 'components/seo/structured-data.tsx', description: 'Structured data component' }
  ]
  
  let allPresent = true
  
  seoChecks.forEach(check => {
    const filePath = path.join(process.cwd(), check.file)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${check.description}: Present`)
    } else {
      console.log(`❌ ${check.description}: Missing`)
      allPresent = false
    }
  })
  
  // Check meta tags in layout
  const layoutPath = path.join(process.cwd(), 'app/[locale]/layout.tsx')
  if (fs.existsSync(layoutPath)) {
    const content = fs.readFileSync(layoutPath, 'utf8')
    const hasMetadata = content.includes('generateMetadata')
    const hasOpenGraph = content.includes('openGraph')
    const hasTwitter = content.includes('twitter')
    
    console.log(`✅ Layout metadata: ${hasMetadata ? 'Present' : 'Missing'}`)
    console.log(`✅ Open Graph tags: ${hasOpenGraph ? 'Present' : 'Missing'}`)
    console.log(`✅ Twitter tags: ${hasTwitter ? 'Present' : 'Missing'}`)
    
    if (!hasMetadata || !hasOpenGraph || !hasTwitter) {
      allPresent = false
    }
  }
  
  return { success: allPresent }
}

async function generateProductionReport() {
  console.log('\n📋 Generating Production Readiness Report')
  console.log('='.repeat(40))
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {}
  }
  
  try {
    // Run all tests
    console.log('1/8 Testing environment variables...')
    report.tests.environment = await testEnvironmentVariables()
    
    console.log('\n2/8 Testing database connectivity...')
    report.tests.database = await testDatabase()
    
    console.log('\n3/8 Testing payment system...')
    report.tests.payment = await testPaymentAPI()
    
    console.log('\n4/8 Testing build process...')
    report.tests.build = await testBuildProcess()
    
    console.log('\n5/8 Testing TypeScript...')
    report.tests.typescript = await testTypeScript()
    
    console.log('\n6/8 Testing code quality...')
    report.tests.linting = await testLinting()
    
    console.log('\n7/8 Testing internationalization...')
    report.tests.i18n = await testInternationalization()
    
    console.log('\n8/8 Testing SEO configuration...')
    report.tests.seo = await testSEOConfiguration()
    
    // Calculate overall score
    const testResults = Object.values(report.tests)
    const passedTests = testResults.filter(result => 
      result && (result.success === true || result === true)
    ).length
    
    report.summary = {
      totalTests: testResults.length,
      passedTests,
      failedTests: testResults.length - passedTests,
      successRate: Math.round((passedTests / testResults.length) * 100),
      productionReady: passedTests === testResults.length
    }
    
    // Final report
    console.log('\n' + '='.repeat(50))
    console.log('🎯 PRODUCTION READINESS REPORT')
    console.log('='.repeat(50))
    console.log(`📅 Generated: ${report.timestamp}`)
    console.log(`✅ Tests passed: ${report.summary.passedTests}/${report.summary.totalTests}`)
    console.log(`❌ Tests failed: ${report.summary.failedTests}`)
    console.log(`📊 Success rate: ${report.summary.successRate}%`)
    console.log(`🚀 Production ready: ${report.summary.productionReady ? '✅ YES' : '❌ NO'}`)
    
    if (report.summary.productionReady) {
      console.log('\n🎉 All systems go! Ready for production deployment.')
      console.log('\n📋 Next steps:')
      console.log('1. Push code to GitHub')
      console.log('2. Deploy to Vercel')
      console.log('3. Configure custom domain')
      console.log('4. Set up monitoring alerts')
    } else {
      console.log('\n⚠️ Issues found. Please resolve before production deployment.')
      console.log('\nFailed tests:')
      Object.entries(report.tests).forEach(([testName, result]) => {
        if (!result || result.success === false) {
          console.log(`❌ ${testName}`)
        }
      })
    }
    
    // Save report
    const reportFile = `production-report-${Date.now()}.json`
    const fs = require('fs')
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(`\n💾 Full report saved to: ${reportFile}`)
    
    return report
    
  } catch (error) {
    console.error('❌ Production test failed:', error.message)
    return { error: error.message, success: false }
  }
}

// Run production tests
if (require.main === module) {
  generateProductionReport().then(report => {
    process.exit(report.summary?.productionReady ? 0 : 1)
  })
}

module.exports = { generateProductionReport, testEnvironmentVariables }