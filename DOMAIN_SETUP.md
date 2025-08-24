# 🌐 Domain & SSL Configuration Guide

## 📋 Domain Satın Alma Önerileri

### Recommended Domain Registrars
1. **Namecheap** - Affordable, good DNS management
2. **GoDaddy** - Popular, 24/7 support
3. **Cloudflare Registrar** - Best pricing, integrated CDN
4. **Google Domains** - Simple interface, reliable

### Domain Options
```
Primary: istanbulportrait.com
Alternatives:
- istanbulphotographer.com  
- portraitistanbul.com
- istanbulphotosession.com
```

## 🔧 Vercel Domain Configuration

### 1. Add Domain to Vercel
1. Vercel Dashboard → Your Project
2. **Settings** → **Domains**
3. **Add Domain** → Enter `istanbulportrait.com`
4. Choose configuration method

### 2. DNS Configuration Options

#### Option A: Nameservers (Recommended)
**Vercel Nameservers:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Setup Steps:**
1. Domain registrar → DNS settings
2. Change nameservers to Vercel's
3. Wait 24-48 hours for propagation

#### Option B: DNS Records
**A Records:**
```
Type: A
Name: @
Value: 76.76.19.61
TTL: Auto/300

Type: A  
Name: www
Value: 76.76.19.61
TTL: Auto/300
```

**CNAME Records:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto/300
```

### 3. SSL Certificate
- **Automatic:** Vercel auto-generates Let's Encrypt SSL
- **Custom:** Upload your own SSL certificate
- **Activation Time:** 5-10 minutes after DNS propagation

## 🚀 Advanced DNS Configuration

### 1. Subdomains Setup
```
blog.istanbulportrait.com → Blog/Articles
admin.istanbulportrait.com → Admin Panel
api.istanbulportrait.com → API Documentation
```

### 2. Email Configuration
```
MX Records for info@istanbulportrait.com:
Type: MX
Name: @
Value: mail.istanbulportrait.com
Priority: 10
```

### 3. Security Headers via DNS
```
TXT Records:
Type: TXT
Name: @
Value: "v=spf1 include:_spf.google.com ~all"

Type: TXT  
Name: _dmarc
Value: "v=DMARC1; p=quarantine; rua=mailto:admin@istanbulportrait.com"
```

## 🔒 SSL/TLS Configuration

### 1. Vercel SSL (Automatic)
- **Certificate Authority:** Let's Encrypt
- **Renewal:** Automatic (every 90 days)
- **Coverage:** istanbulportrait.com + www.istanbulportrait.com
- **Protocol:** TLS 1.3

### 2. SSL Verification
```bash
# Check SSL certificate
curl -I https://istanbulportrait.com

# SSL test
openssl s_client -connect istanbulportrait.com:443 -servername istanbulportrait.com
```

### 3. Force HTTPS Redirect
Already configured in `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        }
      ]
    }
  ]
}
```

## 🌍 CDN & Performance

### 1. Vercel Edge Network
- **Global CDN:** 100+ edge locations
- **Automatic optimization:** Images, static assets
- **Edge caching:** Configured per route

### 2. Cache Configuration
```javascript
// Static assets - 1 year cache
'/_next/static/*': 'public, max-age=31536000, immutable'

// Pages - 5 minutes cache with revalidation  
'/': 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400'

// API routes - No cache
'/api/*': 'no-store, max-age=0'
```

### 3. Image Optimization
```typescript
// next.config.ts
images: {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 60,
  domains: ['istanbulportrait.com']
}
```

## 📊 DNS Propagation & Monitoring

### 1. Check DNS Propagation
```bash
# Command line tools
nslookup istanbulportrait.com
dig istanbulportrait.com

# Online tools
https://dnschecker.org
https://whatsmydns.net
```

### 2. Expected Propagation Times
- **Local ISP:** 2-4 hours
- **Global:** 24-48 hours  
- **Complete:** Up to 72 hours

### 3. Monitoring Setup
```bash
# Uptime monitoring
curl -f https://istanbulportrait.com || echo "Site down!"

# SSL monitoring
openssl s_client -connect istanbulportrait.com:443 -verify_return_error
```

## 🔧 Troubleshooting

### Common DNS Issues

**1. Domain not resolving**
```bash
# Check nameservers
dig ns istanbulportrait.com

# Check A records  
dig a istanbulportrait.com
```

**2. SSL Certificate issues**
```bash
# Verify certificate chain
openssl s_client -connect istanbulportrait.com:443 -showcerts

# Check certificate expiry
echo | openssl s_client -connect istanbulportrait.com:443 2>/dev/null | openssl x509 -noout -dates
```

**3. Mixed Content warnings**
- Ensure all resources use HTTPS
- Check browser console for HTTP resources
- Update `NEXT_PUBLIC_APP_URL` to use HTTPS

### DNS Debugging Commands
```bash
# Test from different DNS servers
dig @8.8.8.8 istanbulportrait.com
dig @1.1.1.1 istanbulportrait.com
dig @208.67.222.222 istanbulportrait.com

# Trace DNS resolution
dig +trace istanbulportrait.com
```

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] Domain purchased and registered
- [ ] DNS records configured  
- [ ] SSL certificate active
- [ ] HTTPS redirect working
- [ ] WWW redirect configured
- [ ] DNS propagation complete

### Verification Tests
```bash
# Test HTTP → HTTPS redirect
curl -I http://istanbulportrait.com

# Test WWW redirect
curl -I https://www.istanbulportrait.com

# Test SSL grade
https://www.ssllabs.com/ssltest/
```

### Post-Launch
- [ ] Google Search Console domain verified
- [ ] Analytics tracking domain updated
- [ ] Social media links updated
- [ ] Email signatures updated
- [ ] Business cards updated

## 📈 Performance Optimization

### 1. DNS Optimization
```
TTL Settings:
A records: 300 seconds (5 minutes)
CNAME records: 3600 seconds (1 hour)
MX records: 86400 seconds (24 hours)
```

### 2. Preload Critical Resources
```html
<!-- Preload fonts -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- DNS prefetch -->
<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="dns-prefetch" href="//images.unsplash.com">
```

### 3. Service Worker for Offline Support
```javascript
// public/sw.js
self.addEventListener('fetch', event => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request) || fetch(event.request)
    )
  }
})
```

## 🔐 Security Best Practices

### 1. Security Headers
```typescript
// next.config.ts headers
{
  key: 'X-Frame-Options',
  value: 'DENY'
},
{
  key: 'Content-Security-Policy', 
  value: "default-src 'self'; img-src 'self' https:; script-src 'self' 'unsafe-inline'"
},
{
  key: 'X-Content-Type-Options',
  value: 'nosniff'
}
```

### 2. HSTS Configuration
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 3. Certificate Transparency
- Automatic with Let's Encrypt
- Monitor at: https://crt.sh/?q=istanbulportrait.com

---

## 📞 Support Contacts

**Domain Issues:**
- Registrar support (varies by provider)
- Vercel support: support@vercel.com

**DNS Propagation:**
- Usually resolves within 24-48 hours
- Contact registrar if issues persist

**SSL Certificate:**  
- Auto-renewed by Vercel
- Contact Vercel support for custom certificates