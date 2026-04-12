import { COLORS, renderEmailLayout, BRAND } from "../resend";

export const WINTER_SALE_TEMPLATES = {
  tr: {
    subject: "Hediye Gibi Bir Kış: Tüm Paketlerde %33 İndirim! ❄️",
    title: "%33 Winter Sale",
    content: `
      <h2 style="color: ${COLORS.text}; margin-top: 0; font-size: 26px;">Merhaba! 👋</h2>
      <p style="font-size: 18px; line-height: 1.6; color: ${COLORS.text}; margin-bottom: 24px;">
        İstanbul'un kış güneşinde, tarihi sokaklarda veya büyüleyici bir terasta hayalinizdeki çekimi gerçekleştirmek için mükemmel bir zaman!
      </p>
      
      <div style="background-color: #f0f9ff; border: 2px dashed ${COLORS.primary}; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
        <h3 style="color: ${COLORS.primary}; font-size: 32px; margin: 0 0 10px;">%33 KIŞ İNDİRİMİ</h3>
        <p style="color: ${COLORS.textMuted}; font-size: 16px; margin: 0;">Tüm Paketlerde Geçerli!</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: ${COLORS.textMuted};">
        Sınırlı bir süre için tüm fotoğraf paketlerimizde %33 indirim fırsatını kaçırmayın. Profesyonel ekibimizle en güzel anılarınızı ölümsüzleştirelim.
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${BRAND.url}/tr/packages" 
           style="background-color: ${COLORS.primary}; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 18px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
          PAKETLERİ İNCELE VE REZERVASYON YAP
        </a>
      </div>

      <div style="background: ${COLORS.background}; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid ${COLORS.primary};">
        <h4 style="color: ${COLORS.primary}; margin-top: 0; font-size: 16px;">Neden Şimdi?</h4>
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px; line-height: 1.5;">
          Kışın İstanbul, Galata'dan Karaköy'e kadar bambaşka bir romantizme bürünür. Takvimler hızla doluyor, yerinizi hemen ayırtın!
        </p>
      </div>
    `,
  },
  en: {
    subject: "Winter Sale: 33% OFF on All Packages! 📸❄️",
    title: "33% Winter Sale",
    content: `
      <h2 style="color: ${COLORS.text}; margin-top: 0; font-size: 26px;">Hello there! 👋</h2>
      <p style="font-size: 18px; line-height: 1.6; color: ${COLORS.text}; margin-bottom: 24px;">
        Winter in Istanbul has its own magic, and we want to help you capture it with a special offer you can't resist!
      </p>
      
      <div style="background-color: #f0f9ff; border: 2px dashed ${COLORS.primary}; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
        <h3 style="color: ${COLORS.primary}; font-size: 32px; margin: 0 0 10px;">33% WINTER SALE</h3>
        <p style="color: ${COLORS.textMuted}; font-size: 16px; margin: 0;">On All Photography Packages!</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: ${COLORS.textMuted};">
        For a limited time, enjoy a massive 33% discount on all our professional photoshoot sessions. Let's create stunning memories together in the heart of Istanbul.
      </p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${BRAND.url}/packages" 
           style="background-color: ${COLORS.primary}; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 18px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
          Check Availability
        </a>
      </div>

      <div style="background: ${COLORS.background}; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid ${COLORS.primary};">
        <h4 style="color: ${COLORS.primary}; margin-top: 0; font-size: 16px;">Why Capture Now?</h4>
        <p style="margin: 0; color: ${COLORS.textMuted}; font-size: 14px; line-height: 1.5;">
          From the historical streets of Galata to the breathtaking Bosphorus views, winter light offers a unique, soft aesthetic for perfect portraits.
        </p>
      </div>
    `,
  },
};

export const getWinterSaleEmailHtml = (locale: "tr" | "en" = "en") => {
  const template = WINTER_SALE_TEMPLATES[locale] || WINTER_SALE_TEMPLATES.en;
  return renderEmailLayout(template.content, template.title, locale);
};
