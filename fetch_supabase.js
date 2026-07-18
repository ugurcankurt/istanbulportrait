const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Extract vars from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL="(.*?)"/)[1];
const supabaseKey = envContent.match(/SUPABASE_SERVICE_KEY="(.*?)"/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Connecting to Supabase...');
  
  // 1. Check site_settings table
  const { data: settingsData, error: settingsError } = await supabase.from('site_settings').select('*').limit(1);
  if (settingsError) {
    console.error('Error fetching site_settings:', settingsError);
  } else {
    console.log('\nsite_settings columns:');
    if (settingsData && settingsData.length > 0) {
      console.log(Object.keys(settingsData[0]).join(', '));
    } else {
      console.log('No data in site_settings');
    }
  }

  // 2. Fetch public tables via PostgREST OpenAPI spec or just known tables from migrations
  const knownTables = [
    'packages', 'pages', 'site_settings', 'blog_posts', 'locations', 
    'rate_limits', 'discounts', 'bookings', 'payments', 'availability', 
    'promo_codes', 'leads', 'customer_portal'
  ];

  console.log('\n--- Checking Known Tables (Row Counts) ---');
  for (const table of knownTables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`Table '${table}' -> Rows: ${count}`);
    } else {
      console.log(`Table '${table}' -> Does not exist or error: ${error.message}`);
    }
  }
}
main();
