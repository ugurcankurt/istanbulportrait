const crypto = require('crypto')
require('dotenv').config()

// Test payment data
const TEST_PAYMENT_DATA = {
  conversationId: `test_${Date.now()}`,
  price: '150.00',
  paidPrice: '150.00', 
  currency: 'EUR',
  basketId: `basket_${Date.now()}`,
  
  paymentCard: {
    cardHolderName: 'Test Cardholder',
    cardNumber: '5528790000000008', // Iyzico test card
    expireMonth: '12',
    expireYear: '30',
    cvc: '123'
  },
  
  buyer: {
    id: 'test@example.com',
    name: 'Test',
    surname: 'User',
    gsmNumber: '+905551234567',
    email: 'test@example.com',
    identityNumber: '11111111111',
    registrationAddress: 'Test Address, Istanbul',
    ip: '127.0.0.1',
    city: 'Istanbul',
    country: 'Turkey'
  },
  
  shippingAddress: {
    contactName: 'Test User',
    city: 'Istanbul',
    country: 'Turkey',
    address: 'Test Address, Istanbul'
  },
  
  billingAddress: {
    contactName: 'Test User', 
    city: 'Istanbul',
    country: 'Turkey',
    address: 'Test Address, Istanbul'
  },
  
  basketItems: [{
    id: 'essential',
    name: 'Essential Photography Package',
    category1: 'Photography',
    itemType: 'VIRTUAL',
    price: '150.00'
  }]
}

function generateAuthString(request, randomString, secretKey, apiKey, uriPath = '/payment/auth') {
  try {
    const requestBody = JSON.stringify(request)
    const payload = randomString + uriPath + requestBody
    
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(payload, 'utf8')
      .digest('hex')
    
    const authString = `apiKey:${apiKey}&randomKey:${randomString}&signature:${signature}`
    return Buffer.from(authString, 'utf8').toString('base64')
  } catch (error) {
    console.error('❌ Auth string generation error:', error)
    throw error
  }
}

async function testPaymentAPI() {
  console.log('💳 Testing Iyzico Payment API...')
  
  const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
  const apiKey = process.env.IYZICO_API_KEY || 'demo-api-key'
  const secretKey = process.env.IYZICO_SECRET_KEY || 'demo-secret-key'
  
  console.log(`🔗 Base URL: ${baseUrl}`)
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`)
  console.log(`🔐 Secret Key: ${secretKey.substring(0, 8)}...`)
  
  if (!apiKey || apiKey === 'demo-api-key' || !secretKey || secretKey === 'demo-secret-key') {
    console.log('⚠️ Demo mode detected - Using test response')
    return testDemoMode()
  }
  
  try {
    const randomString = Date.now().toString()
    const authString = generateAuthString(TEST_PAYMENT_DATA, randomString, secretKey, apiKey)
    
    console.log('📡 Making API request...')
    const response = await fetch(`${baseUrl}/payment/auth`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `IYZWSv2 ${authString}`,
        'x-iyzi-rnd': randomString,
      },
      body: JSON.stringify(TEST_PAYMENT_DATA),
    })
    
    const result = await response.json()
    
    console.log('\n📊 API Response:')
    console.log('Status:', result.status)
    console.log('Payment ID:', result.paymentId)
    console.log('Conversation ID:', result.conversationId)
    
    if (result.status === 'success') {
      console.log('✅ Payment test successful!')
      console.log('💰 Amount:', result.price, result.currency)
    } else {
      console.log('❌ Payment failed')
      console.log('Error Code:', result.errorCode)
      console.log('Error Message:', result.errorMessage)
    }
    
    return result
    
  } catch (error) {
    console.error('❌ Payment API test failed:', error.message)
    return null
  }
}

function testDemoMode() {
  console.log('\n🎭 Testing Demo Mode...')
  
  const testCard = TEST_PAYMENT_DATA.paymentCard.cardNumber
  const isTestCard = testCard === '5528790000000008'
  
  if (isTestCard) {
    console.log('✅ Demo mode: Test card recognized')
    return {
      status: 'success',
      paymentId: `demo_${Date.now()}`,
      conversationId: TEST_PAYMENT_DATA.conversationId,
      price: TEST_PAYMENT_DATA.price,
      currency: TEST_PAYMENT_DATA.currency,
      systemTime: Date.now(),
      errorCode: null,
      errorMessage: null
    }
  } else {
    console.log('❌ Demo mode: Invalid card number')
    return {
      status: 'failure',
      paymentId: null,
      conversationId: TEST_PAYMENT_DATA.conversationId,
      errorCode: 'DEMO_INVALID_CARD',
      errorMessage: 'Demo mode: Use test card 5528790000000008 for successful payment'
    }
  }
}

async function testLocalAPI() {
  console.log('\n🏠 Testing Local Payment API...')
  
  try {
    // Test booking creation first
    const bookingResponse = await fetch('http://localhost:3000/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageId: 'essential',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+905551234567',
        bookingDate: '2024-09-01',
        bookingTime: '14:00',
        totalAmount: 150,
        notes: 'Test booking'
      }),
    })
    
    if (!bookingResponse.ok) {
      console.log('❌ Local booking API not available (server not running?)')
      return
    }
    
    const bookingResult = await bookingResponse.json()
    console.log('✅ Booking created:', bookingResult.booking?.id)
    
    // Test payment initialization  
    const paymentResponse = await fetch('http://localhost:3000/api/payment/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId: bookingResult.booking?.id,
        paymentCard: TEST_PAYMENT_DATA.paymentCard,
        customerInfo: {
          name: 'Test',
          surname: 'User',
          email: 'test@example.com',
          phone: '+905551234567'
        }
      }),
    })
    
    const paymentResult = await paymentResponse.json()
    console.log('💳 Payment result:', paymentResult.status || 'unknown')
    
  } catch (error) {
    console.log('❌ Local API test failed:', error.message)
    console.log('💡 Make sure your development server is running (npm run dev)')
  }
}

function validateEnvironment() {
  console.log('🔍 Validating Payment Environment...')
  
  const requiredVars = [
    'IYZICO_BASE_URL',
    'IYZICO_API_KEY', 
    'IYZICO_SECRET_KEY'
  ]
  
  let isValid = true
  requiredVars.forEach(envVar => {
    const value = process.env[envVar]
    if (!value) {
      console.log(`❌ Missing ${envVar}`)
      isValid = false
    } else if (value.includes('demo') || value.includes('your-')) {
      console.log(`⚠️ ${envVar} appears to be placeholder value`)
    } else {
      console.log(`✅ ${envVar} configured`)
    }
  })
  
  return isValid
}

async function main() {
  console.log('💳 Payment System Test Suite')
  console.log('='.repeat(50))
  
  // Validate environment
  const envValid = validateEnvironment()
  if (!envValid) {
    console.log('\n📋 Please check your .env file for payment configuration')
  }
  
  // Test direct API
  console.log('\n1️⃣ Direct Iyzico API Test')
  await testPaymentAPI()
  
  // Test local API endpoints
  console.log('\n2️⃣ Local API Endpoints Test') 
  await testLocalAPI()
  
  console.log('\n🎯 Payment tests completed!')
  console.log('\n💡 Next steps:')
  console.log('1. Set up production Iyzico merchant account')
  console.log('2. Update environment variables with production keys')
  console.log('3. Test with real payment cards')
  console.log('4. Configure webhook endpoints')
}

if (require.main === module) {
  main()
}

module.exports = { testPaymentAPI, testDemoMode, generateAuthString }