const fs = require('fs');

const langs = ['en', 'ar', 'de', 'es', 'fr', 'ro', 'ru', 'zh'];

const breadcrumbTranslations = {
  en: 'Print Shop',
  tr: 'Baskı Mağazası',
  ru: 'Печатный магазин',
  ar: 'متجر الطباعة',
  de: 'Druckshop',
  es: 'Tienda de impresión',
  fr: 'Boutique d\'impression',
  ro: 'Magazin de Printuri',
  zh: '打印商店'
};

for (const lang of langs) {
    const filePath = 'messages/' + lang + '.json';
    if (fs.existsSync(filePath)) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(data);
            
            const tText = breadcrumbTranslations[lang] || breadcrumbTranslations['en'];
            
            if (json.breadcrumb) {
                if (!json.breadcrumb.prints) {
                    json.breadcrumb.prints = tText;
                    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
                    console.log('Added breadcrumb.prints to ' + lang);
                } else {
                    console.log('Skipped ' + lang + ' (breadcrumb.prints already exists)');
                }
            }
        } catch(e) {
            console.error('Error on ' + lang, e.message);
        }
    } else {
       console.warn('File not found: ' + filePath)
    }
}
