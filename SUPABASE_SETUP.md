# 🗄️ Supabase Production Setup Guide

## 📋 Production Supabase Project Oluşturma

### 1. Yeni Proje Oluştur
1. [supabase.com](https://supabase.com) → **"New Project"**
2. **Organization:** İstanbul Portrait
3. **Project Name:** `istanbul-portrait-production`
4. **Database Password:** Güçlü bir password oluşturun (kaydedin!)
5. **Region:** Europe (Frankfurt) - `eu-central-1`

### 2. API Keys Alma
Proje oluşturulduktan sonra:
1. **Settings** → **API**
2. Şu değerleri kopyalayın:
   ```
   Project URL: https://[project-id].supabase.co
   anon public key: eyJ...
   service_role key: eyJ... (GİZLİ!)
   ```

## 🔧 Database Migration

### 1. SQL Editor ile Manuel Migration
1. Supabase Dashboard → **SQL Editor**
2. **"New Query"** → Copy & paste entire content of `supabase/migrations/001_initial_schema.sql`
3. **Run** butonuna tıkla
4. Başarılı message'ı kontrol et

### 2. Migration Verification
```bash
# Local test
npm run setup:supabase
```

Bu komut şunları kontrol eder:
- ✅ Database connection
- ✅ Tables oluşturuldu mu
- ✅ RLS policies aktif mi
- ✅ Default packages var mı

## 🔒 Security Configuration

### 1. Row Level Security (RLS)
RLS policies zaten migration'da tanımlanmış:

**Packages:**
- ✅ Public read access (herkes paketleri görebilir)

**Bookings:**
- ✅ Users kendi booking'lerini görebilir
- ✅ Service role all access
- ✅ Insert için auth check yok (API'den geliyor)

**Payments:**
- ✅ Sadece service role access

**Customers:**
- ✅ Users kendi bilgilerini görebilir
- ✅ Service role all access

### 2. API Keys Security
**Anon Key:** Frontend'de kullanılabilir
```javascript
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Service Role:** Sadece backend API'lerde
```javascript
SUPABASE_SERVICE_KEY=eyJ... // GİZLİ!
```

## 🚀 Environment Variables

### Local Development (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[anon-key]
SUPABASE_SERVICE_KEY=eyJ[service-role-key]
```

### Vercel Production
**Project Settings → Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL = https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ[anon-key]
SUPABASE_SERVICE_KEY = eyJ[service-role-key]
```

## 📊 Database Schema Overview

### Tables
```sql
packages (4 default records)
├── id: text (primary key)
├── name: jsonb (multilingual)
├── description: jsonb (multilingual) 
├── duration: integer (minutes)
├── price: decimal(10,2)
├── features: jsonb (array)
└── is_popular: boolean

bookings
├── id: text (auto-generated)
├── package_id: text (FK → packages)
├── user_name: text
├── user_email: text
├── user_phone: text
├── booking_date: date
├── booking_time: time
├── status: text (pending/confirmed/cancelled)
├── total_amount: decimal(10,2)
└── notes: text (nullable)

payments
├── id: text (auto-generated)
├── booking_id: text (FK → bookings)
├── payment_id: text (Iyzico ID)
├── conversation_id: text
├── status: text (success/failure/pending)
├── amount: decimal(10,2)
└── provider_response: jsonb

customers
├── id: text (auto-generated)
├── name: text
├── email: text (unique)
└── phone: text
```

## 🔄 Testing & Validation

### 1. Database Connection Test
```bash
npm run test:db
```

Bu test şunları yapar:
- ✅ Connection test
- ✅ Packages read test
- ✅ Booking creation test
- ✅ Customer upsert test
- ✅ RLS policies test
- 🧹 Test data cleanup

### 2. API Endpoints Test
Production'a deploy ettikten sonra test edin:

```bash
# Packages API test
curl https://istanbulportrait.com/api/packages

# Booking API test (POST)
curl -X POST https://istanbulportrait.com/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "packageId": "essential",
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "+90555123456",
    "bookingDate": "2024-09-01",
    "bookingTime": "14:00",
    "totalAmount": 150,
    "notes": "Test booking"
  }'
```

## 📈 Performance Optimization

### 1. Database Indexes
Migration'da otomatik oluşturulur:
```sql
idx_bookings_status ON bookings(status)
idx_bookings_date ON bookings(booking_date)  
idx_bookings_email ON bookings(user_email)
idx_payments_booking_id ON payments(booking_id)
idx_customers_email ON customers(email)
```

### 2. Connection Pooling
Supabase otomatik olarak connection pooling yapar:
- **Session mode:** Long-running connections
- **Transaction mode:** Short transactions
- **Statement mode:** Single statements

### 3. Caching Strategy
```javascript
// packages için client-side caching
const { data: packages } = await supabase
  .from('packages')
  .select('*')
  .cache(300) // 5 minutes cache
```

## 🔍 Monitoring & Logs

### 1. Supabase Dashboard
- **Logs:** Real-time API calls
- **Performance:** Query performance
- **Usage:** API usage statistics

### 2. API Error Handling
Production API endpoints include:
- ✅ Rate limiting (10 req/min per IP)
- ✅ Input validation (Zod schemas)
- ✅ Duplicate booking prevention
- ✅ Comprehensive error logging
- ✅ Graceful error responses

### 3. Backup Strategy
Supabase otomatik backup yapar:
- **Point-in-time recovery:** 7 günlük
- **Full backups:** Günlük
- **Manual backup:** Dashboard'dan export

## 🚨 Troubleshooting

### Common Issues

**1. Migration Errors**
```sql
-- Manual table check
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies WHERE schemaname = 'public';
```

**2. Connection Issues**
- Environment variables doğru mu?
- API keys expired olmamış mı?
- Region correct mi?

**3. RLS Policy Issues**
```sql
-- Disable RLS temporarily for debugging
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
-- Don't forget to re-enable!
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
```

**4. Performance Issues**
```sql
-- Check slow queries
SELECT query, mean_exec_time, total_exec_time, calls
FROM pg_stat_statements 
WHERE query LIKE '%bookings%'
ORDER BY mean_exec_time DESC;
```

## 🎯 Production Checklist

### Pre-Production
- [ ] Supabase project created
- [ ] Migration executed successfully
- [ ] RLS policies tested
- [ ] API keys secured
- [ ] Environment variables set
- [ ] Database tests passing

### Post-Production
- [ ] Connection monitoring setup
- [ ] Backup verification
- [ ] Performance baseline established
- [ ] Error alerting configured
- [ ] Usage tracking enabled

---

**🔗 Useful Links:**
- Dashboard: `https://supabase.com/dashboard/project/[project-id]`
- API Docs: `https://supabase.com/dashboard/project/[project-id]/api`
- Logs: `https://supabase.com/dashboard/project/[project-id]/logs/explorer`