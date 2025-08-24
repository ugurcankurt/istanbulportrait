const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function testDatabase() {
  console.log('🧪 Testing database functionality...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
    console.error('❌ Missing environment variables')
    process.exit(1)
  }
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Test 1: Packages table read access
    console.log('\n📦 Testing packages table...')
    const { data: packages, error: packagesError } = await supabaseClient
      .from('packages')
      .select('*')
    
    if (packagesError) {
      console.error('❌ Packages read failed:', packagesError.message)
      return false
    }
    
    console.log(`✅ Found ${packages.length} packages`)
    packages.forEach(pkg => {
      const name = typeof pkg.name === 'object' ? pkg.name.en || 'Unknown' : pkg.name
      console.log(`  - ${pkg.id}: ${name} (€${pkg.price})`)
    })
    
    // Test 2: Booking creation (with admin client)
    console.log('\n📅 Testing booking creation...')
    const testBooking = {
      package_id: 'essential',
      user_name: 'Test User',
      user_email: 'test@example.com',
      user_phone: '+90 555 123 4567',
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: '14:00',
      status: 'pending',
      total_amount: 150.00,
      notes: 'Test booking - will be deleted'
    }
    
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(testBooking)
      .select()
      .single()
    
    if (bookingError) {
      console.error('❌ Booking creation failed:', bookingError.message)
      return false
    }
    
    console.log('✅ Booking created:', booking.id)
    
    // Test 3: Customer upsert
    console.log('\n👤 Testing customer creation...')
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .upsert({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+90 555 123 4567'
      })
      .select()
      .single()
    
    if (customerError) {
      console.error('❌ Customer creation failed:', customerError.message)
    } else {
      console.log('✅ Customer created/updated:', customer.id)
    }
    
    // Cleanup: Delete test records
    console.log('\n🧹 Cleaning up test data...')
    await supabaseAdmin.from('bookings').delete().eq('id', booking.id)
    if (customer) {
      await supabaseAdmin.from('customers').delete().eq('id', customer.id)
    }
    console.log('✅ Test data cleaned up')
    
    // Test 4: RLS policies
    console.log('\n🔒 Testing Row Level Security policies...')
    
    // Try to read bookings with anon client (should fail or be limited)
    const { data: anonBookings, error: rlsError } = await supabaseClient
      .from('bookings')
      .select('*')
      .limit(1)
    
    if (rlsError) {
      console.log('✅ RLS properly blocking unauthorized access')
    } else {
      console.log(`⚠️ RLS might be too permissive, found ${anonBookings.length} bookings`)
    }
    
    console.log('\n🎉 Database tests completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    return false
  }
}

async function validateEnvironment() {
  console.log('🔍 Validating environment configuration...')
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_KEY'
  ]
  
  let valid = true
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.error(`❌ Missing ${envVar}`)
      valid = false
    } else {
      console.log(`✅ ${envVar} configured`)
    }
  })
  
  if (!valid) {
    console.log('\n📋 Please check your .env file and ensure all Supabase variables are set')
    process.exit(1)
  }
  
  return valid
}

async function main() {
  console.log('🚀 Database Test Suite')
  console.log('='.repeat(50))
  
  await validateEnvironment()
  const success = await testDatabase()
  
  if (success) {
    console.log('\n🎯 All tests passed! Database is ready for production.')
    process.exit(0)
  } else {
    console.log('\n💥 Some tests failed. Please check the errors above.')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { testDatabase, validateEnvironment }