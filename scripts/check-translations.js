const fs = require('fs')
const path = require('path')

const MESSAGES_DIR = path.join(process.cwd(), 'messages')
const SUPPORTED_LOCALES = ['en', 'ar', 'ru', 'es']
const MASTER_LOCALE = 'en'

/**
 * Recursively get all keys from a nested object
 */
function getNestedKeys(obj, prefix = '') {
  let keys = []
  
  for (const key in obj) {
    const currentKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getNestedKeys(obj[key], currentKey))
    } else {
      keys.push(currentKey)
    }
  }
  
  return keys
}

/**
 * Load and parse translation files
 */
function loadTranslations() {
  const translations = {}
  
  for (const locale of SUPPORTED_LOCALES) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`)
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing translation file: ${locale}.json`)
      continue
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      translations[locale] = JSON.parse(content)
    } catch (error) {
      console.error(`❌ Invalid JSON in ${locale}.json:`, error.message)
      translations[locale] = {}
    }
  }
  
  return translations
}

/**
 * Check translation completeness
 */
function checkTranslationCompleteness() {
  console.log('🔍 Checking Translation Completeness')
  console.log('='.repeat(40))
  
  const translations = loadTranslations()
  const masterKeys = getNestedKeys(translations[MASTER_LOCALE] || {})
  
  if (masterKeys.length === 0) {
    console.error('❌ No keys found in master locale (en.json)')
    return false
  }
  
  console.log(`📊 Master locale (${MASTER_LOCALE}) has ${masterKeys.length} keys\n`)
  
  let allComplete = true
  const report = {}
  
  // Check each locale against master
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === MASTER_LOCALE) continue
    
    const localeKeys = getNestedKeys(translations[locale] || {})
    const missingKeys = masterKeys.filter(key => !localeKeys.includes(key))
    const extraKeys = localeKeys.filter(key => !masterKeys.includes(key))
    
    const completeness = Math.round(((masterKeys.length - missingKeys.length) / masterKeys.length) * 100)
    
    report[locale] = {
      totalKeys: localeKeys.length,
      missingKeys: missingKeys.length,
      extraKeys: extraKeys.length,
      completeness: completeness,
      missingKeysList: missingKeys,
      extraKeysList: extraKeys
    }
    
    // Report status
    const statusIcon = completeness === 100 ? '✅' : completeness >= 90 ? '⚠️' : '❌'
    console.log(`${statusIcon} ${locale.toUpperCase()}: ${completeness}% complete (${localeKeys.length}/${masterKeys.length} keys)`)
    
    if (missingKeys.length > 0) {
      console.log(`   Missing ${missingKeys.length} keys:`)
      missingKeys.slice(0, 5).forEach(key => console.log(`     - ${key}`))
      if (missingKeys.length > 5) {
        console.log(`     ... and ${missingKeys.length - 5} more`)
      }
      allComplete = false
    }
    
    if (extraKeys.length > 0) {
      console.log(`   Extra ${extraKeys.length} keys (not in master):`)
      extraKeys.slice(0, 3).forEach(key => console.log(`     + ${key}`))
      if (extraKeys.length > 3) {
        console.log(`     ... and ${extraKeys.length - 3} more`)
      }
    }
    
    console.log()
  }
  
  // Summary
  console.log('📋 SUMMARY')
  console.log('='.repeat(20))
  
  if (allComplete) {
    console.log('🎉 All translations are complete!')
  } else {
    console.log('⚠️ Some translations are incomplete:')
    
    Object.entries(report).forEach(([locale, data]) => {
      if (data.completeness < 100) {
        console.log(`   ${locale}: ${data.missingKeys} missing keys`)
      }
    })
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS')
  console.log('='.repeat(20))
  
  Object.entries(report).forEach(([locale, data]) => {
    if (data.completeness < 90) {
      console.log(`🔴 ${locale.toUpperCase()}: Critical - Need professional translation review`)
    } else if (data.completeness < 100) {
      console.log(`🟡 ${locale.toUpperCase()}: Good - Just a few missing keys`)
    } else {
      console.log(`🟢 ${locale.toUpperCase()}: Excellent - Fully complete`)
    }
  })
  
  return allComplete
}

/**
 * Check for common translation issues
 */
function checkTranslationQuality() {
  console.log('\n🎯 Checking Translation Quality')
  console.log('='.repeat(30))
  
  const translations = loadTranslations()
  let issuesFound = false
  
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === MASTER_LOCALE) continue
    
    const issues = []
    const localeData = translations[locale] || {}
    
    // Check for untranslated placeholder text
    function checkForPlaceholders(obj, prefix = '') {
      for (const key in obj) {
        const currentKey = prefix ? `${prefix}.${key}` : key
        const value = obj[key]
        
        if (typeof value === 'string') {
          // Check for common placeholder patterns
          if (
            value.includes('TODO:') ||
            value.includes('PLACEHOLDER') ||
            value.includes('[translate]') ||
            value === translations[MASTER_LOCALE]?.[key] // Same as English
          ) {
            issues.push(`${currentKey}: Placeholder text detected`)
          }
          
          // Check for HTML/markup issues
          if (value.includes('<') && !value.includes('>')) {
            issues.push(`${currentKey}: Broken HTML markup`)
          }
        } else if (typeof value === 'object' && value !== null) {
          checkForPlaceholders(value, currentKey)
        }
      }
    }
    
    checkForPlaceholders(localeData)
    
    if (issues.length > 0) {
      console.log(`⚠️ ${locale.toUpperCase()} quality issues:`)
      issues.forEach(issue => console.log(`   - ${issue}`))
      issuesFound = true
    } else {
      console.log(`✅ ${locale.toUpperCase()}: No quality issues detected`)
    }
  }
  
  return !issuesFound
}

/**
 * Generate missing translations template
 */
function generateMissingTranslationsTemplate() {
  console.log('\n📝 Generating Missing Translations Template')
  console.log('='.repeat(45))
  
  const translations = loadTranslations()
  const masterKeys = getNestedKeys(translations[MASTER_LOCALE] || {})
  
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === MASTER_LOCALE) continue
    
    const localeKeys = getNestedKeys(translations[locale] || {})
    const missingKeys = masterKeys.filter(key => !localeKeys.includes(key))
    
    if (missingKeys.length > 0) {
      const templateFile = `missing-translations-${locale}.json`
      const template = {}
      
      // Build template object
      missingKeys.forEach(keyPath => {
        const keys = keyPath.split('.')
        let current = template
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {}
          }
          current = current[keys[i]]
        }
        
        // Get the English value as reference
        const englishValue = keys.reduce((obj, key) => obj?.[key], translations[MASTER_LOCALE])
        current[keys[keys.length - 1]] = `TODO: Translate "${englishValue}"`
      })
      
      fs.writeFileSync(templateFile, JSON.stringify(template, null, 2))
      console.log(`📄 Created ${templateFile} with ${missingKeys.length} missing translations`)
    }
  }
}

/**
 * Main function
 */
function main() {
  console.log('🌍 Translation Analysis Tool')
  console.log('='.repeat(50))
  console.log(`📁 Checking translations in: ${MESSAGES_DIR}`)
  console.log(`🔤 Supported locales: ${SUPPORTED_LOCALES.join(', ')}`)
  console.log(`👑 Master locale: ${MASTER_LOCALE}\n`)
  
  // Check if messages directory exists
  if (!fs.existsSync(MESSAGES_DIR)) {
    console.error('❌ Messages directory not found:', MESSAGES_DIR)
    process.exit(1)
  }
  
  const isComplete = checkTranslationCompleteness()
  const isQualityGood = checkTranslationQuality()
  
  // Generate templates for missing translations
  if (!isComplete) {
    generateMissingTranslationsTemplate()
  }
  
  // Final verdict
  console.log('\n🏁 FINAL VERDICT')
  console.log('='.repeat(20))
  
  if (isComplete && isQualityGood) {
    console.log('🎯 Perfect! All translations are complete and high quality.')
    process.exit(0)
  } else if (isComplete && !isQualityGood) {
    console.log('✅ Translations complete but some quality issues detected.')
    process.exit(0)
  } else {
    console.log('⚠️ Translations incomplete. Please complete missing translations.')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { 
  checkTranslationCompleteness, 
  checkTranslationQuality,
  getNestedKeys,
  loadTranslations 
}