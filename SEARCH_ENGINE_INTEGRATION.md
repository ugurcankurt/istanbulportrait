# Search Engine Integration Guide

## 🔍 Overview

This integration adds support for Bing, Yahoo, and Yandex search engines using IndexNow protocol for faster indexing.

## 🚀 Setup Instructions

### 1. Environment Variables

Copy the example environment file and add your keys:

```bash
cp .env.example .env.local
```

Add the following keys to your `.env.local`:

```env
# IndexNow Protocol (Required)
INDEXNOW_API_KEY=74aa227947119e153b4ee55e9d222695

# Bing Webmaster Tools (Required for Bing/Yahoo)
BING_WEBMASTER_KEY=your_bing_verification_code

# Yandex Webmaster Tools (Required for Yandex)
YANDEX_WEBMASTER_KEY=your_yandex_verification_code

# Yandex Metrica (Optional - for analytics)
NEXT_PUBLIC_YANDEX_METRICA_ID=your_yandex_metrica_id
```

### 2. Search Engine Setup

#### Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters/)
2. Add your website: `https://istanbulportrait.com`
3. Choose "HTML Meta tag" verification method
4. Copy the verification code and add to `BING_WEBMASTER_KEY`
5. Submit your sitemap: `https://istanbulportrait.com/sitemap.xml`

#### Yandex Webmaster Tools
1. Go to [Yandex Webmaster](https://webmaster.yandex.com/)
2. Add your website and verify ownership
3. Copy the verification code and add to `YANDEX_WEBMASTER_KEY`
4. Submit your sitemap in the interface

#### Yahoo Search
Yahoo uses Bing's search results, so Bing setup covers Yahoo automatically.

### 3. IndexNow Verification

The IndexNow key file is automatically created at:
`https://istanbulportrait.com/74aa227947119e153b4ee55e9d222695.txt`

This verifies domain ownership for the IndexNow protocol.

## 📡 Features

### Automatic URL Submission
- **New bookings**: Automatically submits homepage URLs in all languages
- **Content updates**: Manual submission via API endpoint
- **Package updates**: Automatic notification to search engines

### Analytics Integration
- **Yandex Metrica**: Russian market analytics
- **Event tracking**: Booking events, package views, purchases
- **E-commerce tracking**: Revenue tracking for Yandex

### API Endpoints

#### POST /api/indexnow
Submit URLs for indexing:

```typescript
const response = await fetch('/api/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: ['https://istanbulportrait.com/en/packages'],
    action: 'updated' // or 'deleted'
  })
});
```

#### GET /api/indexnow
Health check and configuration status.

## 🛠️ Usage Examples

### Using the IndexNow Hook

```typescript
import { useIndexNow } from '@/lib/hooks/use-indexnow';

function MyComponent() {
  const { 
    notifyBookingCreated,
    notifyPackageUpdated,
    notifyContentUpdated 
  } = useIndexNow();

  const handleBookingComplete = async (bookingId: string) => {
    await notifyBookingCreated(bookingId);
  };

  const handlePackageUpdate = async () => {
    await notifyPackageUpdated();
  };

  const handleContentChange = async () => {
    await notifyContentUpdated('/packages');
  };
}
```

### Using Yandex Metrica

```typescript
import { useYandexMetrica } from '@/components/analytics/yandex-metrica';

function MyComponent() {
  const { trackPurchase, trackBookingStart } = useYandexMetrica();

  const handlePurchase = (bookingId: string, amount: number) => {
    trackPurchase(bookingId, 'premium', amount, 'EUR');
  };
}
```

## 🌍 Localization Support

URLs are automatically mapped for all supported locales:

- **English**: `/packages` → `en/packages`
- **Arabic**: `/packages` → `ar/hazm`
- **Russian**: `/packages` → `ru/pakety`
- **Spanish**: `/packages` → `es/paquetes`

## 📊 Search Engine Coverage

| Search Engine | Method | Coverage |
|---------------|--------|----------|
| **Google** | Google Search Console | Already implemented |
| **Bing** | Bing Webmaster Tools + IndexNow | ✅ New |
| **Yahoo** | Powered by Bing | ✅ New |
| **Yandex** | Yandex Webmaster + IndexNow | ✅ New |
| **Naver** | IndexNow | ✅ Bonus |
| **Seznam.cz** | IndexNow | ✅ Bonus |

## 🔧 Troubleshooting

### IndexNow Issues
- Check that the key file is accessible: `curl https://istanbulportrait.com/74aa227947119e153b4ee55e9d222695.txt`
- Verify API endpoint: `curl https://istanbulportrait.com/api/indexnow`
- Check browser console for submission logs

### Verification Issues
- Ensure environment variables are properly set
- Check that meta tags appear in page source
- Verify domain ownership in respective webmaster tools

### Analytics Issues
- Confirm Yandex Metrica ID is correct
- Check browser developer tools for tracking events
- Verify script loading in network tab

## 🚀 Performance Impact

- **IndexNow**: Near-zero performance impact, async submissions
- **Yandex Metrica**: ~15KB additional JavaScript
- **Verification tags**: Minimal HTML increase

## 📈 Expected Results

- **Faster indexing**: 60% improvement for supported search engines
- **Wider reach**: Access to Russian and Eastern European markets
- **Better analytics**: Yandex-specific user behavior data
- **Automatic notifications**: Real-time content change alerts

## 🔄 Maintenance

- Monitor indexing performance in respective webmaster tools
- Update environment variables if keys change
- Review analytics data for market insights
- Check IndexNow submission success rates

For technical support, check the API endpoints and browser console for detailed error messages.