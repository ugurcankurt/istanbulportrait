# 📊 Analytics & Monitoring Setup Guide

## 🎯 Google Analytics 4 Setup

### 1. Create GA4 Property
1. Go to [analytics.google.com](https://analytics.google.com)
2. **Admin** → **Create Property**
3. **Property Details:**
   - Property name: `Istanbul Portrait`
   - Reporting time zone: `Turkey Time (GMT+3)`
   - Currency: `Euro (EUR)`
   - Industry: `Arts & Entertainment`
   - Business size: `Small`

### 2. Data Streams Setup
1. **Admin** → **Data Streams** → **Add Stream** → **Web**
2. **Stream Details:**
   - Website URL: `https://istanbulportrait.com`
   - Stream name: `Istanbul Portrait Website`
   - Enhanced measurement: **Enable all**

### 3. Get Measurement ID
- Copy the **Measurement ID** (G-XXXXXXXXXX)
- Add to environment variables:
```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 4. Install Analytics Code
Analytics code is already integrated in:
- `components/analytics/google-analytics.tsx`
- `lib/analytics.ts`

Add to your layout:
```typescript
import { GoogleAnalytics } from '@/components/analytics/google-analytics'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
```

## 📈 Custom Events Tracking

### 1. Photography Business Events
```typescript
import { trackBookingEvent, trackPaymentEvent, trackPackageView } from '@/lib/analytics'

// Track package views
trackPackageView('essential') // When user views package

// Track booking starts  
trackBookingEvent('premium', 280) // When user starts booking

// Track payments
trackPaymentEvent('luxury', 450, 'success') // Payment completion
```

### 2. User Interaction Events
```typescript
import { trackContactForm, trackLanguageChange, trackGalleryView } from '@/lib/analytics'

// Contact form submissions
trackContactForm()

// Language changes
trackLanguageChange('ar') // When user switches to Arabic

// Gallery interactions
trackGalleryView('istanbul_rooftop_1.jpg')
```

### 3. E-commerce Tracking
```typescript
// Purchase event (successful booking)
gtag('event', 'purchase', {
  transaction_id: 'booking_123',
  value: 280,
  currency: 'EUR',
  items: [{
    item_id: 'premium',
    item_name: 'Premium Photography Package',
    category: 'Photography Service',
    quantity: 1,
    price: 280
  }]
})
```

## 🔍 Google Search Console

### 1. Property Setup
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. **Add Property** → **URL Prefix**
3. Enter: `https://istanbulportrait.com`

### 2. Verification Methods
**Option A: HTML Meta Tag**
```html
<meta name="google-site-verification" content="VERIFICATION_CODE" />
```

**Option B: Google Analytics**
- If GA4 is already setup, verification is automatic

**Option C: DNS TXT Record**
```
Type: TXT
Name: @
Value: google-site-verification=VERIFICATION_CODE
```

### 3. Sitemap Submission
1. **Sitemaps** → **Add a new sitemap**
2. Submit: `https://istanbulportrait.com/sitemap.xml`
3. Wait for indexing status

## 📊 Key Metrics to Monitor

### 1. Business Metrics
- **Booking conversion rate:** Visitors → Bookings
- **Revenue per session:** Total revenue / Sessions
- **Package popularity:** Which packages are viewed/booked most
- **Geographic distribution:** Where visitors come from

### 2. SEO Metrics  
- **Organic search traffic:** Google Search Console
- **Keyword rankings:** Target keywords performance
- **Click-through rates:** Search result CTR
- **Page speed:** Core Web Vitals

### 3. User Experience Metrics
- **Bounce rate:** Single-page sessions
- **Session duration:** Time spent on site
- **Pages per session:** Site engagement
- **Mobile vs Desktop:** Device usage

### 4. Technical Metrics
- **Page load speed:** Response times
- **Error rates:** 4xx/5xx errors
- **API performance:** Booking/payment API response times
- **Uptime:** Site availability

## 🚨 Monitoring & Alerts

### 1. Vercel Analytics
Already configured in `vercel.json`:
- **Speed Insights:** Core Web Vitals
- **Web Analytics:** Privacy-friendly analytics
- **Real User Monitoring:** Actual user experience

### 2. Health Check Monitoring
```bash
# Run health checks
npm run health-check        # Full system check
npm run health-check:ssl    # SSL certificate check  
npm run health-check:perf   # Performance check
```

Health check covers:
- ✅ Website availability
- ✅ API endpoints  
- ✅ Database connectivity
- ✅ SSL certificate validity
- ✅ Response times

### 3. Uptime Monitoring Services
**Recommended Services:**
- **UptimeRobot:** Free tier, 50 monitors
- **Pingdom:** Comprehensive monitoring
- **StatusCake:** Free tier available

### 4. Error Tracking
**Sentry Integration** (Optional):
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

## 📈 Custom Dashboards

### 1. GA4 Custom Reports
Create reports for:
- **Photography Packages Performance**
- **Booking Funnel Analysis** 
- **Multi-language User Behavior**
- **Mobile vs Desktop Conversion**

### 2. Google Data Studio
Connect GA4 + Search Console:
1. Go to [datastudio.google.com](https://datastudio.google.com)
2. Create new report
3. Connect data sources:
   - Google Analytics 4
   - Google Search Console
   - (Optional) Supabase via connector

### 3. Business Intelligence Queries
```sql
-- Top performing packages (Supabase)
SELECT 
  package_id,
  COUNT(*) as booking_count,
  AVG(total_amount) as avg_amount,
  SUM(total_amount) as total_revenue
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status = 'confirmed'
GROUP BY package_id
ORDER BY total_revenue DESC;

-- Conversion by language
SELECT 
  -- Custom dimension from GA4
  user_language,
  sessions,
  bookings,
  (bookings::float / sessions) * 100 as conversion_rate
FROM analytics_data
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);
```

## 🔒 Privacy & GDPR Compliance

### 1. Cookie Consent
Integrated cookie consent banner:
- `components/analytics/google-analytics.tsx`
- Respects user consent preferences
- Allows opt-out of tracking

### 2. Data Retention
**GA4 Settings:**
- Data retention: 14 months (default)
- User activity: Delete after 2 months of inactivity

### 3. Privacy Policy
Include sections on:
- Google Analytics data collection
- Cookie usage
- User rights (access, deletion)
- Data processing purposes

## 📊 Performance Benchmarks

### Target Metrics
```
Page Load Speed:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s  
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

Business Metrics:
- Booking conversion rate: > 2%
- Average session duration: > 2 minutes
- Bounce rate: < 60%
- Mobile traffic: > 60%

Technical Metrics:
- Uptime: > 99.9%
- API response time: < 500ms
- Database response time: < 200ms
```

## 🚀 Going Live Checklist

### Pre-Launch
- [ ] GA4 property created and configured
- [ ] Search Console verified
- [ ] Sitemap submitted
- [ ] Health check endpoints working
- [ ] Error tracking setup
- [ ] Performance monitoring active

### Post-Launch Monitoring (First Week)
- [ ] Daily traffic monitoring
- [ ] Conversion tracking verification
- [ ] Technical performance review
- [ ] SEO indexing status check
- [ ] User behavior analysis

### Monthly Reviews
- [ ] Business metrics analysis
- [ ] SEO performance review  
- [ ] Technical health report
- [ ] A/B testing opportunities
- [ ] Conversion optimization

## 🛠️ Debugging & Troubleshooting

### Analytics Not Working
```javascript
// Debug GA4 in browser console
console.log('GA Tracking ID:', GA_TRACKING_ID)
console.log('DataLayer:', window.dataLayer)

// Check if events are firing
gtag('event', 'test_event', { debug_mode: true })
```

### Health Check Issues
```bash
# Test specific endpoints
curl -I https://istanbulportrait.com/api/health
curl -I https://istanbulportrait.com/sitemap.xml

# Check SSL
openssl s_client -connect istanbulportrait.com:443 -servername istanbulportrait.com
```

### Performance Issues
```bash
# Lighthouse CLI
npx lighthouse https://istanbulportrait.com --view

# Check bundle size
npm run build:analyze
```

---

**🔗 Useful Links:**
- GA4 Admin: `https://analytics.google.com/analytics/web/#/pXXXXXX/admin`
- Search Console: `https://search.google.com/search-console/welcome`
- Vercel Analytics: `https://vercel.com/dashboard/analytics`
- Health Check: `https://istanbulportrait.com/api/health`