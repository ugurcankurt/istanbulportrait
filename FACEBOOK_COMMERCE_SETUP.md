# 🛒 Facebook Commerce Manager Kurulum Talimatları

## 📋 Gereksinimler Kontrolü

Websitemizdeki implementasyon tamamlandı:

### ✅ Teknik Gereksinimler
- [x] Facebook Pixel kurulu ve aktif
- [x] PageView events mevcut
- [x] ViewContent events service parametreleri ile gönderiliyor
- [x] Schema.org microdata tags eklendi
- [x] JSON-LD structured data commerce-ready
- [x] Service-based tracking implementasyonu

## 🔧 Facebook Commerce Manager Kurulum Adımları

### 1. Facebook Commerce Manager'a Giriş
1. https://business.facebook.com/commerce/catalogs/ adresine git
2. Business hesabınızla giriş yap
3. "Create Catalog" butonuna tıkla

### 2. Service Catalog Oluşturma
1. **Catalog Type**: "Services" seç
2. **Business**: İlgili business hesabını seç
3. **Catalog Name**: "Istanbul Photographer Services" 
4. **Currency**: EUR
5. "Create" butonuna tıkla

### 3. Pixel'i Catalog'a Bağlama
1. Catalog'a gir → **Data Sources** sekmesi
2. **Add Products** → **Import Automatically From Website**
3. **Select Pixel**: Mevcut pixel'i seç (673844425107448)
4. **Next** butonuna tıkla

### 4. Auto-Sync Ayarları
1. **Product Updates**:
   - ✅ "Add new products" aktif
   - ✅ "Update existing product info" aktif
2. **Trusted Domains**:
   - `istanbulportrait.com` ekle
   - `www.istanbulportrait.com` ekle
3. **Default Currency**: EUR
4. "Save" butonuna tıkla

### 5. Microdata Debugger ile Test
1. https://business.facebook.com/ads/microdata/debug adresine git
2. Test URL: `https://istanbulportrait.com/en/packages`
3. **Debug** butonuna tıkla
4. Service microdata'nın doğru okunduğunu kontrol et

## 📊 Beklenen Sonuçlar

### Otomatik Senkronizasyon
- **15-30 dakika** içinde ilk products görülmeye başlar
- **24 saat** içinde tüm senkronizasyon tamamlanır

### Catalog'da Görülecek Services
1. **Essential Photography Package** (€150)
2. **Premium Photography Package** (€280)
3. **Luxury Photography Package** (€450)
4. **Rooftop Photography Package** (€150)

## 🚀 Dynamic Service Ads Kurulumu (İsteğe Bağlı)

### 1. Facebook Ads Manager
1. **Campaigns** → **Create** → **Catalog Sales**
2. **Catalog**: Yeni oluşturulan service catalog'u seç
3. **Ad Set**: İstanbul audience targeting
4. **Creative**: Dynamic service template seç

### 2. Retargeting Campaign
1. **Custom Audiences** → **Website Traffic**
2. **Pixel Events**: ViewContent (service)
3. **Retention**: 30 gün
4. **Campaign**: Service retargeting

## 🔍 Troubleshooting

### Yaygın Sorunlar
1. **"Pixel not ready"** hatası:
   - 24 saat bekleyin
   - PageView events kontrol edin

2. **"Microdata incomplete"** hatası:
   - Microdata debugger kullanın
   - Schema.org validation yapın

3. **Products görünmüyor**:
   - Trusted domains kontrolü
   - ViewContent events parametreleri

### Debug Komutları
```javascript
// Browser Console'da test
fbq('track', 'ViewContent', {
  content_type: 'service',
  content_ids: ['premium'],
  content_name: 'Premium Photography Package',
  value: 280,
  currency: 'EUR'
});
```

## 📞 Destek

Sorun yaşarsanız:
- Facebook Business Support
- Meta Developer Documentation
- Microdata Debugger Tool

---

**Son Güncelleme**: 2025-09-08  
**Status**: ✅ Implementasyon Tamamlandı