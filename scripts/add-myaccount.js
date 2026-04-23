const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '../messages');
const files = fs.readdirSync(messagesDir).filter(f => f.endsWith('.json'));

const translations = {
  en: "My Account",
  tr: "Hesabım",
  ar: "حسابي",
  ru: "Мой аккаунт",
  es: "Mi Cuenta",
  fr: "Mon Compte",
  de: "Mein Konto",
  ro: "Contul Meu",
  zh: "我的账户"
};

for (const file of files) {
  const lang = path.basename(file, '.json');
  const filePath = path.join(messagesDir, file);
  
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (content.nav) {
    content.nav.myAccount = translations[lang] || "My Account";
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Updated ${file}`);
  }
}
