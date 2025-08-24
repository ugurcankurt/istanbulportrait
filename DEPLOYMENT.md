# 🚀 Vercel Deployment Guide

## 📋 Ön Gereksinimler

### 1. Vercel Hesabı
- [vercel.com](https://vercel.com) adresinden hesap oluşturun
- GitHub hesabınızla bağlantı kurun

### 2. GitHub Repository
- Repository'yi GitHub'a push edin:
```bash
git remote add origin https://github.com/YOUR_USERNAME/istanbulportrait.git
git branch -M main
git push -u origin main
```

## 🔧 Vercel Deployment Adımları

### 1. New Project Oluşturma
1. Vercel dashboard'da **"New Project"** tıklayın
2. GitHub repository'nizi seçin: `istanbulportrait`
3. Import butonuna tıklayın

### 2. Project Configuration
```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 3. Environment Variables Ekleme
**Project Settings > Environment Variables** bölümünde şu değişkenleri ekleyin:

#### 🗄️ Supabase (Production)
```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_KEY=your_production_service_role_key
```

#### 💳 Iyzico (Production)
```
IYZICO_BASE_URL=https://api.iyzipay.com
IYZICO_API_KEY=your_production_api_key
IYZICO_SECRET_KEY=your_production_secret_key
```

#### 📧 Email (Opsiyonel)
```
RESEND_API_KEY=your_resend_api_key
CONTACT_EMAIL=info@istanbulportrait.com
```

#### 🌐 App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NODE_ENV=production
```

#### 📊 Analytics (Opsiyonel)
```
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga4_id
```

### 4. Deploy
- **"Deploy"** butonuna tıklayın
- Build process'i izleyin (~2-3 dakika)
- Deploy tamamlandığında URL'nizi alın

## 🌍 Domain Configuration

### Custom Domain Ekleme
1. **Project Settings > Domains**
2. **"Add Domain"** tıklayın
3. `istanbulportrait.com` girin
4. DNS kayıtlarını güncelleyin:

```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### SSL Sertifikası
- Vercel otomatik olarak Let's Encrypt SSL sertifikası oluşturur
- ~5-10 dakika içinde aktif olur

## 🔧 Production Optimizasyonları

### 1. Performance Monitoring
```bash
# Vercel Analytics aktif et
Project Settings > Analytics > Enable
```

### 2. Function Configuration
```bash
# Edge runtime için optimize et (vercel.json zaten var)
"regions": ["iad1", "fra1"]
"functions": {
  "app/api/**/*.ts": {
    "maxDuration": 30
  }
}
```

### 3. Caching Headers
- Static assets için aggressive caching
- API routes için no-cache
- (next.config.ts zaten yapılandırılmış)

## 🗄️ Database Setup

### Supabase Production
1. [supabase.com](https://supabase.com) → New Project
2. Organization/Project name girin
3. Database password oluşturun
4. Region seçin (Europe - Frankfurt önerilir)

### Migration Çalıştırma
```bash
# Supabase CLI kurulum
npm install -g @supabase/cli

# Local Supabase bağlantısı
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Production migration
supabase db push
```

### RLS Policies Aktifleştirme
```sql
-- Manuel olarak Supabase Dashboard'dan SQL Editor'de çalıştırın
-- supabase/migrations/001_initial_schema.sql dosyasındaki tüm komutları
```

## 💳 Payment System

### Iyzico Production
1. [iyzico.com](https://iyzico.com) merchant başvurusu
2. KYC belgelerini tamamlayın
3. Production API keys alın
4. Webhook URL'ini ayarlayın:
   ```
   https://istanbulportrait.com/api/payment/webhook
   ```

### Test Kartları (Sandbox)
```
Başarılı: 5528790000000008
Başarısız: 5406675000000015
```

## 📊 Monitoring & Analytics

### 1. Google Analytics 4
```javascript
// Vercel environment variables'a ekleyin
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 2. Google Search Console
1. [search.google.com/search-console](https://search.google.com/search-console)
2. Property ekle: `https://istanbulportrait.com`
3. Sitemap gönder: `https://istanbulportrait.com/sitemap.xml`

### 3. Vercel Analytics
```bash
# Project Settings > Analytics
Speed Insights: Enable
Web Analytics: Enable
```

## ✅ Launch Checklist

### Pre-Launch
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Payment system tested
- [ ] All pages responsive
- [ ] SEO meta tags complete
- [ ] Analytics tracking setup

### Post-Launch
- [ ] Google Search Console sitemap submitted
- [ ] Performance monitoring active
- [ ] Error tracking enabled
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured

## 🔄 Continuous Deployment

### Automatic Deployments
- GitHub push → Vercel auto-deploy
- Preview deployments for PR'lar
- Production deployment main branch

### Manual Deployment
```bash
# Vercel CLI ile manual deploy
npm install -g vercel
vercel --prod
```

## 🆘 Troubleshooting

### Build Errors
```bash
# Local build test
npm run build
npm run start

# Type check
npm run type-check
```

### Environment Issues
- Environment variables case-sensitive
- NEXT_PUBLIC_ prefix client-side için gerekli
- Restart deployment after env changes

### Database Connection
```bash
# Test Supabase connection
npm run test:db
```

---

**🎉 Deployment başarılı olduğunda:**
- Site: `https://istanbulportrait.com`
- Admin Panel: Supabase Dashboard
- Analytics: Vercel Analytics + Google Analytics