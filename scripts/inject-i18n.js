const fs = require('fs');

const langs = ['en', 'ar', 'de', 'es', 'fr', 'ro', 'ru', 'zh'];

const newTranslations = {
  en: { 
    title: 'Print Shop', 
    subtitle: 'Transform your digital memories into premium physical art shipped globally.',
    upload_photo: 'Upload Photo',
    min_dpi: 'Min 200 DPI Required',
    add_to_cart: 'Add to Cart',
    shipping_details: 'Shipping Details',
    billing_address: 'Shipping Address', 
    complete_order: 'Complete Print Order',
    empty_cart: 'Your print cart is empty.',
    checkout: 'Checkout'
  },
  ru: {
    title: 'Печатный магазин',
    subtitle: 'Превратите ваши цифровые воспоминания в печатное искусство премиум-класса с доставкой по всему миру.',
    upload_photo: 'Загрузить фото',
    min_dpi: 'Мин. 200 DPI',
    add_to_cart: 'В корзину',
    shipping_details: 'Детали доставки',
    billing_address: 'Адрес доставки',
    complete_order: 'Завершить заказ',
    empty_cart: 'Ваша корзина пуста.',
    checkout: 'Оформление заказа'
  },
  ar: {
    title: 'متجر الطباعة',
    subtitle: 'حوّل ذكرياتك الرقمية إلى فن مادي فاخر يُشحن عالميًا.',
    upload_photo: 'تحميل الصورة',
    min_dpi: 'الحد الأدنى 200 DPI',
    add_to_cart: 'أضف إلى السلة',
    shipping_details: 'تفاصيل الشحن',
    billing_address: 'عنوان الشحن',
    complete_order: 'إتمام الطلب',
    empty_cart: 'عربة الطباعة فارغة.',
    checkout: 'الدفع'
  },
  de: {
    title: 'Druckshop',
    subtitle: 'Verwandeln Sie digitale Erinnerungen in erstklassige physische Kunst.',
    upload_photo: 'Foto hochladen',
    min_dpi: 'Mindestens 200 DPI',
    add_to_cart: 'In den Warenkorb',
    shipping_details: 'Versanddetails',
    billing_address: 'Lieferadresse',
    complete_order: 'Bestellung abschließen',
    empty_cart: 'Ihr Warenkorb ist leer.',
    checkout: 'Kasse'
  },
  es: {
    title: 'Tienda de impresión',
    subtitle: 'Transforma tus recuerdos digitales en arte físico premium.',
    upload_photo: 'Subir foto',
    min_dpi: 'Mínimo 200 DPI requerido',
    add_to_cart: 'Añadir al carrito',
    shipping_details: 'Detalles de envío',
    billing_address: 'Dirección de envío',
    complete_order: 'Completar pedido',
    empty_cart: 'Tu carrito de impresiones está vacío.',
    checkout: 'Pagar'
  },
  fr: {
    title: "Boutique d'impression",
    subtitle: "Transformez vos souvenirs numériques en art physique de qualité supérieure.",
    upload_photo: "Télécharger une photo",
    min_dpi: "Minimum 200 DPI requis",
    add_to_cart: "Ajouter au panier",
    shipping_details: "Détails d'expédition",
    billing_address: "Adresse d'expédition",
    complete_order: "Passer la commande",
    empty_cart: "Votre panier est vide.",
    checkout: "Paiement"
  },
  ro: {
    title: 'Magazin de Printuri',
    subtitle: 'Transformă-ți amintirile digitale în artă fizică premium.',
    upload_photo: 'Atașează Foto',
    min_dpi: 'Minim 200 DPI obligatoriu',
    add_to_cart: 'Adaugă în coș',
    shipping_details: 'Detalii livrare',
    billing_address: 'Adresă livrare',
    complete_order: 'Finalizează comanda',
    empty_cart: 'Coșul tău este gol.',
    checkout: 'Finalizare'
  },
  zh: {
    title: '打印商店',
    subtitle: '将您的数字记忆转化为优质的实体艺术。',
    upload_photo: '上传照片',
    min_dpi: '至少需要 200 DPI',
    add_to_cart: '加入购物车',
    shipping_details: '配送信息',
    billing_address: '配送地址',
    complete_order: '完成订单',
    empty_cart: '您的购物车是空的。',
    checkout: '结账'
  }
};

for (const lang of langs) {
    const filePath = 'messages/' + lang + '.json';
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(data);
            
            const tMap = newTranslations[lang] || newTranslations['en'];
            
            if (!json.prints) {
               json.prints = tMap;
               fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
               console.log('Updated ' + lang);
            } else {
               console.log('Skipped ' + lang + ' (already has prints key)');
            }
        } catch(e) {
            console.error('Error on ' + lang, e.message);
        }
    } else {
       console.warn('File not found: ' + filePath)
    }
}
