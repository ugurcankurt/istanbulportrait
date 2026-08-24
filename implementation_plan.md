# Çeviri Sistemini Arka Plana (İstemci Tarafına) Taşıma

Mevcut durumda sunucu, sayfa yüklenmeden önce çevirilerin bitmesini (veya 6 saniyelik zaman aşımına uğramasını) beklemektedir. Bu, NVIDIA API yavaş olduğunda veya hata verdiğinde sitenizin açılışını her halükarda 6 saniye geciktirir. Sitenizin hızını artırmak ve "çeviriler arka planda çalışsın" mantığını tam anlamıyla uygulamak için çeviri sürecini sunucudan ayırıp arka plana almalıyız.

## Önerilen Değişiklikler

### 1. Çeviri İşlemini API'ye Taşıma (`app/api/reviews/translate/route.ts`)
Yeni bir API ucu oluşturacağız. Bu API, İngilizce yorumları alacak ve seçili dile çevirip geri döndürecek. Çeviriler bu API üzerinde `unstable_cache` ile 1 yıl boyunca önbelleklenecek.

### 2. `lib/reviews-service.ts` Güncellemesi
Sunucu tarafında (Server Component) sayfa yüklenirken çeviri yapma mantığını tamamen kaldıracağız. Sunucu, yorumları anında ve gecikmesiz olarak İngilizce hazırlayıp sayfayı saniyesinde yükleyecek.

### 3. İstemci Tarafında (Client-Side) Arka Plan Çevirisi (`components/reviews/reviews-client.tsx`)
Sayfa kullanıcıya anında yüklendikten sonra (İngilizce yorumlarla), arka planda sessizce `/api/reviews/translate` adresine bir istek atılacak. Çeviri başarılı olursa yorum metinleri akıcı bir şekilde kendi dilindeki versiyonlarıyla güncellenecek. Hata verirse İngilizce kalmaya devam edecek.

## Avantajları
- **Sıfır Gecikme:** Sitenizin açılış hızı çeviri servisinden tamamen bağımsız hale gelecek (anında açılacak).
- **Hata Toleransı:** Çeviri servisi çökse bile kullanıcılar hiçbir yavaşlık hissetmeyecek.

Bu planı onaylıyorsanız hemen uygulamaya başlayacağım!
