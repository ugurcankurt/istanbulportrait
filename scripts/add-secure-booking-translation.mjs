import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, '..', 'messages');

const locales = ['en', 'ar', 'de', 'es', 'fr', 'ro', 'ru', 'tr', 'zh'];

const translations = {
  en: {
    secure_booking: "Secure Booking",
    pay_full_in_cash: "Pay the full amount (€{amount}) in cash on photoshoot day."
  },
  tr: {
    secure_booking: "Güvenli Rezervasyon",
    pay_full_in_cash: "Tüm tutarı (€{amount}) fotoğraf çekimi günü nakit olarak ödeyin."
  },
  de: {
    secure_booking: "Sichere Buchung",
    pay_full_in_cash: "Bezahlen Sie den vollen Betrag (€{amount}) in bar am Tag des Fotoshootings."
  },
  es: {
    secure_booking: "Reserva Segura",
    pay_full_in_cash: "Pague el monto total (€{amount}) en efectivo el día de la sesión de fotos."
  },
  fr: {
    secure_booking: "Réservation Sécurisée",
    pay_full_in_cash: "Payez le montant total (€{amount}) en espèces le jour de la séance photo."
  },
  ru: {
    secure_booking: "Безопасное бронирование",
    pay_full_in_cash: "Оплатите полную сумму (€{amount}) наличными в день фотосессии."
  },
  ar: {
    secure_booking: "حجز آمن",
    pay_full_in_cash: "ادفع المبلغ بالكامل (€{amount}) نقدًا في يوم جلسة التصوير."
  },
  zh: {
    secure_booking: "安全预订",
    pay_full_in_cash: "在拍照当天以现金支付全额（€{amount}）。"
  },
  ro: {
    secure_booking: "Rezervare Securizată",
    pay_full_in_cash: "Plătiți suma integrală (€{amount}) în numerar în ziua ședinței foto."
  }
};

for (const loc of locales) {
  try {
    const filePath = join(messagesDir, `${loc}.json`);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    
    if (!data.checkout) data.checkout = {};
    if (!data.checkout.security) data.checkout.security = {};
    
    data.checkout.security.secure_booking = translations[loc].secure_booking;
    data.checkout.security.pay_full_in_cash = translations[loc].pay_full_in_cash;
    
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`✅ Updated ${loc}.json`);
  } catch (e) {
    console.error(`❌ Failed to process ${loc}.json: ${e.message}`);
  }
}
