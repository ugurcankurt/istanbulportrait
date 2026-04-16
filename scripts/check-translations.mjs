import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, '..', 'messages');

const en = JSON.parse(readFileSync(join(messagesDir, 'en.json'), 'utf-8'));
const tr = JSON.parse(readFileSync(join(messagesDir, 'tr.json'), 'utf-8'));

function getAllKeyValues(obj, prefix = '') {
  let entries = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      entries = entries.concat(getAllKeyValues(value, fullKey));
    } else {
      entries.push({ key: fullKey, value });
    }
  }
  return entries;
}

function getValueByPath(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj);
}

const enEntries = getAllKeyValues(en);
const issues = [];

for (const { key, value: enVal } of enEntries) {
  const trVal = getValueByPath(tr, key);
  
  if (trVal === undefined) {
    issues.push({ key, type: 'MISSING', en: enVal, tr: '—' });
    continue;
  }
  
  // Check if Turkish value is identical to English (not translated)
  if (typeof enVal === 'string' && typeof trVal === 'string') {
    // Skip keys that shouldn't be translated (technical values, placeholders, etc.)
    const skipKeys = [
      'direction', 'button', // WhatsApp stays same
      'expire_month', 'expire_year', 'cvc', 'month_short', 'year_short',
      'card_number', 'expire_mm', 'expire_yy', 'cvc_placeholder',
      'phone', 'email', // placeholder emails/phones
      'phone_number',
      'support_email', 'support_phone', // contact info stays same
      'copyright',
    ];
    
    const lastKey = key.split('.').pop();
    if (skipKeys.includes(lastKey)) continue;
    
    // Skip if value is purely technical (URLs, codes, format strings)
    if (enVal.match(/^[A-Z\s\d.@+\-_\/{}()\[\]•#%:]+$/) && enVal.length < 15) continue;
    
    // Flag if Turkish value matches English exactly
    if (enVal === trVal && enVal.length > 3) {
      issues.push({ key, type: 'NOT_TRANSLATED', en: enVal, tr: trVal });
    }
  }
}

if (issues.length === 0) {
  console.log('\n🎉 TR.json — Tüm çeviriler doğru görünüyor! Çevrilmemiş metin bulunamadı.\n');
} else {
  console.log(`\n⚠️  TR.json — ${issues.length} sorunlu anahtar bulundu:\n`);
  console.log('='.repeat(100));
  
  for (const issue of issues) {
    const icon = issue.type === 'MISSING' ? '❌' : '🟡';
    const label = issue.type === 'MISSING' ? 'EKSİK' : 'ÇEVRİLMEMİŞ';
    console.log(`\n${icon} [${label}] ${issue.key}`);
    console.log(`   EN: "${issue.en}"`);
    console.log(`   TR: "${issue.tr}"`);
  }
  console.log('\n' + '='.repeat(100));
}
