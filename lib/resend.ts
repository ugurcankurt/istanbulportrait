import { Resend } from "resend";
import type { SiteSettings } from "./settings-service";

export const getEmailColors = (settings: SiteSettings) => {
  const isDark = settings.color_mode === "dark";
  const themeColor = settings.theme_color || "violet";

  // Map shadcn theme presets to realistic primary HEX colors
  const primaryColors: Record<string, string> = {
    zinc: "#18181b",
    slate: "#0f172a",
    stone: "#1c1917",
    gray: "#111827",
    neutral: "#171717",
    red: "#dc2626",
    rose: "#e11d48",
    orange: "#f97316",
    green: "#16a34a",
    blue: "#2563eb",
    yellow: "#eab308",
    violet: "#7c3aed",
  };

  const primaryHex = primaryColors[themeColor] || "#7c3aed";

  return {
    primary: primaryHex,
    background: isDark ? "#09090b" : "#f8fafc",
    card: isDark ? "#121214" : "#ffffff",
    text: isDark ? "#f8fafc" : "#1a1a2e",
    textMuted: isDark ? "#a1a1aa" : "#64748b",
    border: isDark ? "#27272a" : "#e2e8f0",
    warning: "#f59e0b",
  };
};

const resolveLocaleValue = (
  dict?: Record<string, string>,
  locale: string = "en",
  fallback: string = "",
) => {
  if (!dict) return fallback;
  return dict[locale] || dict["en"] || Object.values(dict)[0] || fallback;
};

export const renderEmailLayout = (
  content: string,
  title: string,
  locale: string = "en",
  settings: SiteSettings,
) => {
  const isRTL = locale === "ar";
  const colors = getEmailColors(settings);
  const siteName = settings.site_name || "Website";
  const orgName = settings.organization_name || siteName;
  const address = resolveLocaleValue(settings.address, locale, "");
  const isDark = settings.color_mode === "dark";

  // Header Logo logic (uses logo_url which typically is the light mode logo, meaning it's dark text, we need the white one on primary bg)
  // The header usually has a primary color background, so we always prefer logo_dark_url (which is the white logo)
  const headerLogo =
    settings.logo_dark_url || "https://360istanbul.com.tr/360istanbul_white_logo.webp";

  // Footer logo logic
  const footerLogo = isDark
    ? settings.logo_dark_url || "https://360istanbul.com.tr/360istanbul_white_logo.webp"
    : settings.logo_url || "https://360istanbul.com.tr/360istanbul_dark_logo.webp";

  const socials = [];
  if (settings.instagram_url) {
    socials.push(
      `<a href="${settings.instagram_url}" style="color: ${colors.primary}; text-decoration: none; margin: 0 10px;">Instagram</a>`,
    );
  }
  if (settings.facebook_url) {
    socials.push(
      `<a href="${settings.facebook_url}" style="color: ${colors.primary}; text-decoration: none; margin: 0 10px;">Facebook</a>`,
    );
  }
  if (settings.youtube_url) {
    socials.push(
      `<a href="${settings.youtube_url}" style="color: ${colors.primary}; text-decoration: none; margin: 0 10px;">YouTube</a>`,
    );
  }
  if (settings.tiktok_url) {
    socials.push(
      `<a href="${settings.tiktok_url}" style="color: ${colors.primary}; text-decoration: none; margin: 0 10px;">TikTok</a>`,
    );
  }

  return `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${isRTL ? "rtl" : "ltr"}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${colors.background}; color: ${colors.text};">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${colors.background}; padding: 20px 0;">
        <tr>
          <td align="center">
            <!-- Header Banner -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background: ${colors.primary}; border-radius: 16px 16px 0 0; overflow: hidden; max-width: 100%;">
              <tr>
                <td align="center" style="padding: 40px 20px; text-align: center;">
                  <img src="${headerLogo}" alt="${siteName} Logo" width="180" style="display: block; margin: 0 auto; max-width: 100%;">
                </td>
              </tr>
            </table>

            <!-- Main Content Card -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: ${colors.card}; border: 1px solid ${colors.border}; border-top: none; border-radius: 0 0 16px 16px; overflow: hidden; max-width: 100%;">
              <tr>
                <td style="padding: 40px 30px; ${isRTL ? "text-align: right; direction: rtl;" : "text-align: left;"}">
                  ${content}
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; max-width: 100%;">
              <tr>
                <td align="center" style="padding: 30px; text-align: center; color: ${colors.textMuted}; font-size: 14px;">
                  <img src="${footerLogo}" alt="${siteName} Footer" width="120" style="display: block; margin: 0 auto 15px; opacity: 0.8;">
                  <p style="margin: 0 0 10px; font-weight: bold; color: ${colors.text};">${orgName}</p>
                  ${address ? `<p style="margin: 0 0 15px;">${address}</p>` : ""}
                  
                  ${socials.length > 0
      ? `<p style="margin: 0 0 20px;">${socials.join("")}</p>`
      : ""
    }
                  
                  <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 20px 0;">
                  <p style="font-size: 12px; margin: 0;">© ${new Date().getFullYear()} ${orgName}. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

export interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageName: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  originalAmount?: number;
  bookingId: string;
  peopleCount?: number;
  locale?: string;
  notes?: string;
}

const EMAIL_TRANSLATIONS: Record<string, any> = {
  en: {
    subject: "Booking Confirmation",
    title: "Booking Confirmation",
    greeting: "Dear {name},",
    thankYou: "Thank you for booking with us! Your booking has been confirmed.",
    detailsTitle: "Booking Details",
    bookingId: "Booking ID",
    package: "Package",
    peopleCount: "Number of People",
    date: "Date",
    time: "Time",
    total: "Total Amount",
    whatsNext: "What's Next?",
    whatsNextDesc:
      "We will contact you 24 hours before your session to confirm the location and any special requirements.",
    questions: "Have questions? Contact us at",
  },
  ru: {
    subject: "Подтверждение бронирования",
    title: "Подтверждение бронирования",
    greeting: "Уважаемый(ая) {name},",
    thankYou: "Спасибо за бронирование! Ваше бронирование подтверждено.",
    detailsTitle: "Детали бронирования",
    bookingId: "ID бронирования",
    package: "Пакет",
    peopleCount: "Количество человек",
    date: "Дата",
    time: "Время",
    total: "Общая сумма",
    whatsNext: "Что дальше?",
    whatsNextDesc:
      "Мы свяжемся с вами за 24 часа до сессии, чтобы подтвердить место проведения.",
    questions: "Есть вопросы? Свяжитесь с нами:",
  },
  tr: {
    subject: "Rezervasyon Onayı",
    title: "Rezervasyon Onaylandı",
    greeting: "Merhaba {name},",
    thankYou:
      "Bizimle rezervasyon yaptığınız için teşekkürler! Rezervasyonunuz başarıyla onaylandı.",
    detailsTitle: "Rezervasyon Detayları",
    bookingId: "Rezervasyon Kodu",
    package: "Paket",
    peopleCount: "Kişi Sayısı",
    date: "Tarih",
    time: "Saat",
    total: "Toplam Tutar",
    whatsNext: "Sırada Ne Var?",
    whatsNextDesc:
      "Çekim lokasyonunu ve diğer detayları netleştirmek için seansınızdan 24 saat önce sizinle iletişime geçeceğiz.",
    questions: "Sorularınız mı var? Bize ulaşın:",
  },
};

export const sendBookingConfirmation = async (
  data: BookingConfirmationData,
  settings: SiteSettings,
) => {
  try {
    const apiKey =
      settings.resend_api_key || process.env.RESEND_API_KEY || "demo-resend-key";
    if (!apiKey || apiKey === "demo-resend-key") return;
    const resend = new Resend(apiKey);
    const colors = getEmailColors(settings);

    const locale =
      data.locale && EMAIL_TRANSLATIONS[data.locale] ? data.locale : "en";
    const t = EMAIL_TRANSLATIONS[locale];

    // Background color of the internal content area if dark mode
    const detailsBg = settings.color_mode === "dark" ? "#1e1e24" : "#fafafa";

    const content = `
      <h2 style="color: ${colors.text}; margin-top: 0; font-size: 24px;">${t.greeting.replace(
      "{name}",
      data.customerName,
    )}</h2>
      <p style="font-size: 16px; line-height: 1.6; color: ${colors.textMuted};">${t.thankYou}</p>

      <div style="border: 1px solid ${colors.border}; padding: 25px; border-radius: 12px; margin: 30px 0; background-color: ${detailsBg};">
        <h3 style="color: ${colors.primary}; margin-top: 0; font-size: 18px; text-transform: uppercase;">${t.detailsTitle}</h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>${t.bookingId}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>${t.package}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.packageName}</td>
          </tr>
          ${data.peopleCount && data.peopleCount > 1
        ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>${t.peopleCount}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.peopleCount}</td>
          </tr>`
        : ""
      }
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>${t.date}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>${t.time}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.bookingTime}</td>
          </tr>
          <tr>
            <td style="padding: 15px 0 0 0; font-size: 18px; color: ${colors.text};"><strong>${t.total}:</strong></td>
            <td style="padding: 15px 0 0 0; text-align: right; font-weight: bold; color: ${colors.primary}; font-size: 20px;">
              €${data.totalAmount}
            </td>
          </tr>
        </table>
      </div>

      <div style="background: ${colors.background}; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid ${colors.primary};">
        <h4 style="color: ${colors.primary}; margin-top: 0; font-size: 16px;">${t.whatsNext}</h4>
        <p style="margin: 0; color: ${colors.textMuted}; line-height: 1.5;">${t.whatsNextDesc}</p>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <p style="color: ${colors.textMuted}; font-size: 14px;">
          ${t.questions} <a href="mailto:${settings.contact_email}" style="color: ${colors.primary}; text-decoration: none; font-weight: bold;">${settings.contact_email}</a>
        </p>
      </div>
    `;

    await resend.emails.send({
      from: `${settings.site_name || "Photographer"} <${settings.contact_email}>`,
      to: [data.customerEmail],
      subject: `${t.subject} - ${data.packageName}`,
      html: renderEmailLayout(content, t.title, locale, settings),
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
};

export const sendAdminBookingNotification = async (
  data: BookingConfirmationData,
  settings: SiteSettings,
) => {
  try {
    const apiKey =
      settings.resend_api_key || process.env.RESEND_API_KEY || "demo-resend-key";
    if (!apiKey || apiKey === "demo-resend-key") return;

    if (!settings.contact_email) return;
    const resend = new Resend(apiKey);
    const colors = getEmailColors(settings);

    const detailsBg = settings.color_mode === "dark" ? "#1e1e24" : "#fafafa";

    const content = `
      <h2 style="color: ${colors.text}; margin-top: 0; font-size: 24px;">New Booking Received! 📸</h2>
      <p style="font-size: 16px; line-height: 1.6; color: ${colors.textMuted};">You have just received an automatic booking from the website.</p>

      <div style="border: 1px solid ${colors.border}; padding: 25px; border-radius: 12px; margin: 30px 0; background-color: ${detailsBg};">
        <h3 style="color: ${colors.primary}; margin-top: 0; font-size: 18px; text-transform: uppercase;">Customer & Booking Details</h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>Booking ID:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>Name:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>Email:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>Phone:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.customerPhone}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>Package:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.packageName}</td>
          </tr>
          ${data.peopleCount
        ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>People Count:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text};">${data.peopleCount}</td>
          </tr>`
        : ""
      }
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>Date:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; font-weight: bold; color: ${colors.warning};">${data.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>Time:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; font-weight: bold; color: ${colors.warning};">${data.bookingTime}</td>
          </tr>
          ${data.notes
        ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>Notes:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; font-style: italic; color: ${colors.text};">${data.notes}</td>
          </tr>`
        : ""
      }
          <tr>
            <td style="padding: 15px 0 0 0; font-size: 18px; color: ${colors.text};"><strong>Total Revenue:</strong></td>
            <td style="padding: 15px 0 0 0; text-align: right; font-weight: bold; color: ${colors.primary}; font-size: 20px;">
              €${data.totalAmount}
            </td>
          </tr>
        </table>
      </div>
      
      <p style="color: ${colors.textMuted}; font-size: 14px; text-align: center;">You can review this inside your Admin Panel bookings tab.</p>
    `;

    await resend.emails.send({
      from: `System <${settings.contact_email}>`,
      to: ["7amodi.19955@gmail.com"],
      subject: `🎉 NEW BOOKING: ${data.packageName} - ${data.bookingDate}`,
      html: renderEmailLayout(content, "New Booking Notification", "en", settings),
    });
  } catch (error) {
    console.error("Error sending admin notification email:", error);
  }
};
