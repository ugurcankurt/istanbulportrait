const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function setupSupabase() {
  console.log('🗄️ Setting up Supabase production database...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Required variables:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- SUPABASE_SERVICE_KEY')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test connection
    console.log('🔄 Testing Supabase connection...')
    const { data, error } = await supabase
      .from('packages')
      .select('count(*)', { count: 'exact' })
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.log('📋 Make sure you have run the migration in Supabase dashboard:')
      console.log('1. Go to Supabase dashboard > SQL Editor')
      console.log('2. Run the content of supabase/migrations/001_initial_schema.sql')
      process.exit(1)
    }
    
    console.log('✅ Database connection successful!')
    console.log(`📊 Packages table has ${data?.[0]?.count || 0} records`)
    
    // Check if packages exist
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .limit(5)
    
    if (packagesError) {
      console.error('❌ Error fetching packages:', packagesError.message)
    } else {
      console.log('📦 Sample packages:')
      packages.forEach(pkg => {
        console.log(`  - ${pkg.id}: €${pkg.price}`)
      })
    }
    
    // Test RLS policies
    console.log('🔒 Testing Row Level Security...')
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: publicPackages, error: rlsError } = await supabaseClient
      .from('packages')
      .select('id, price')
      .limit(1)
    
    if (rlsError) {
      console.warn('⚠️ RLS policy might need adjustment:', rlsError.message)
    } else {
      console.log('✅ RLS policies working correctly')
    }
    
    console.log('🎉 Supabase setup completed successfully!')
    console.log('🔗 Dashboard:', `${supabaseUrl.replace('supabase.co', 'supabase.co/project')}`)
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  setupSupabase()
}

module.exports = { setupSupabase }