import { Resend } from "resend";
import type { SiteSettings } from "./settings-service";

export const COLORS = {
  primary: "#4f46e5",
  primaryDark: "#3730a3",
  background: "#f8fafc",
  card: "#ffffff",
  text: "#1a1a2e",
  textMuted: "#64748b",
  border: "#e2e8f0",
  success: "#16a34a",
  warning: "#f59e0b",
  info: "#3b82f6",
  footer: "#1a1a2e",
  destructive: "#ef4444",
};

export const renderEmailLayout = (
  content: string,
  title: string,
  locale: string = "en",
  settings: SiteSettings,
) => {
  const isRTL = locale === "ar";
  return `
    <!DOCTYPE html>
    <html lang="${locale}" dir="${isRTL ? "rtl" : "ltr"}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${COLORS.background}; color: ${COLORS.text};">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.background};">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <!-- Header Banner -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background: ${COLORS.primary}; border-radius: 16px 16px 0 0; overflow: hidden;">
              <tr>
                <td align="center" style="padding: 40px 20px; text-align: center;">
                  <img src="${settings.logo_dark_url || 'https://360istanbul.com.tr/360istanbul_white_logo.webp'}" alt="Logo" width="180" style="display: block; margin: 0 auto; max-width: 100%;">
                </td>
              </tr>
            </table>

            <!-- Main Content Card -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-top: none; border-radius: 0 0 16px 16px; overflow: hidden;">
              <tr>
                <td style="padding: 40px 30px; ${isRTL ? "text-align: right; direction: rtl;" : "text-align: left;"}">
                  ${content}
                </td>
              </tr>
            </table>

            <!-- Footer -->
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
              <tr>
                <td align="center" style="padding: 30px; text-align: center; color: ${COLORS.textMuted}; font-size: 14px;">
                  <img src="${settings.logo_url || 'https://360istanbul.com.tr/360istanbul_dark_logo.webp'}" alt="Logo Footer" width="120" style="display: block; margin: 0 auto 15px; opacity: 0.8;">
                  <p style="margin: 0 0 10px;">Istanbul Photographer</p>
                  <p style="margin: 0 0 20px;">
                    ${settings.instagram_url ? `<a href="${settings.instagram_url}" style="color: ${COLORS.primary}; text-decoration: none;">Instagram</a>` : ''}
                  </p>
                  <hr style="border: none; border-top: 1px solid ${COLORS.border}; margin: 20px 0;">
                  <p style="font-size: 12px; margin: 0;">© ${new Date().getFullYear()} All rights reserved.</p>
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
    whatsNextDesc: "We will contact you 24 hours before your session to confirm the location and any special requirements.",
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
    whatsNextDesc: "Мы свяжемся с вами за 24 часа до сессии, чтобы подтвердить место проведения.",
    questions: "Есть вопросы? Свяжитесь с нами:",
  },
  tr: {
    subject: "Rezervasyon Onayı",
    title: "Rezervasyon Onaylandı",
    greeting: "Merhaba {name},",
    thankYou: "Bizimle rezervasyon yaptığınız için teşekkürler! Rezervasyonunuz başarıyla onaylandı.",
    detailsTitle: "Rezervasyon Detayları",
    bookingId: "Rezervasyon Kodu",
    package: "Paket",
    peopleCount: "Kişi Sayısı",
    date: "Tarih",
    time: "Saat",
    total: "Toplam Tutar",
    whatsNext: "Sırada Ne Var?",
    whatsNextDesc: "Çekim lokasyonunu ve diğer detayları netleştirmek için seansınızdan 24 saat önce sizinle iletişime geçeceğiz.",
    questions: "Sorularınız mı var? Bize ulaşın:",
  }
};

export const sendBookingConfirmation = async (
  data: BookingConfirmationData,
  settings: SiteSettings
) => {
  try {
    const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY || "demo-resend-key";
    if (!apiKey || apiKey === "demo-resend-key") return;
    const resend = new Resend(apiKey);

    const locale = data.locale && EMAIL_TRANSLATIONS[data.locale] ? data.locale : "en";
    const t = EMAIL_TRANSLATIONS[locale];

    const content = `
      <h2 style="color: ${COLORS.text}; margin-top: 0; font-size: 24px;">${t.greeting.replace("{name}", data.customerName)}</h2>
      <p style="font-size: 16px; line-height: 1.6; color: ${COLORS.textMuted};">${t.thankYou}</p>

      <div style="border: 1px solid ${COLORS.border}; padding: 25px; border-radius: 12px; margin: 30px 0; background-color: #fafafa;">
        <h3 style="color: ${COLORS.primary}; margin-top: 0; font-size: 18px; text-transform: uppercase;">${t.detailsTitle}</h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>${t.bookingId}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>${t.package}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.packageName}</td>
          </tr>
          ${data.peopleCount && data.peopleCount > 1 ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>${t.peopleCount}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.peopleCount}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>${t.date}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>${t.time}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.bookingTime}</td>
          </tr>
          <tr>
            <td style="padding: 15px 0 0 0; font-size: 18px;"><strong>${t.total}:</strong></td>
            <td style="padding: 15px 0 0 0; text-align: right; font-weight: bold; color: ${COLORS.primary}; font-size: 20px;">
              €${data.totalAmount}
            </td>
          </tr>
        </table>
      </div>

      <div style="background: ${COLORS.background}; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid ${COLORS.primary};">
        <h4 style="color: ${COLORS.primary}; margin-top: 0; font-size: 16px;">${t.whatsNext}</h4>
        <p style="margin: 0; color: ${COLORS.textMuted}; line-height: 1.5;">${t.whatsNextDesc}</p>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <p style="color: ${COLORS.textMuted}; font-size: 14px;">
          ${t.questions} <a href="mailto:${settings.contact_email}" style="color: ${COLORS.primary}; text-decoration: none; font-weight: bold;">${settings.contact_email}</a>
        </p>
      </div>
    `;

    await resend.emails.send({
      from: `Photographer <${settings.contact_email}>`,
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
  settings: SiteSettings
) => {
  try {
    const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY || "demo-resend-key";
    if (!apiKey || apiKey === "demo-resend-key") return;

    if (!settings.contact_email) return;
    const resend = new Resend(apiKey);

    const content = `
      <h2 style="color: ${COLORS.text}; margin-top: 0; font-size: 24px;">New Booking Received! 📸</h2>
      <p style="font-size: 16px; line-height: 1.6; color: ${COLORS.textMuted};">You have just received an automatic booking from the website.</p>

      <div style="border: 1px solid ${COLORS.border}; padding: 25px; border-radius: 12px; margin: 30px 0; background-color: #fafafa;">
        <h3 style="color: ${COLORS.primary}; margin-top: 0; font-size: 18px; text-transform: uppercase;">Customer & Booking Details</h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>Booking ID:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.bookingId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>Name:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>Email:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>Phone:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.customerPhone}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>Package:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.packageName}</td>
          </tr>
          ${data.peopleCount ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>People Count:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right;">${data.peopleCount}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>Date:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right; font-weight: bold; color: ${COLORS.warning};">${data.bookingDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>Time:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right; font-weight: bold; color: ${COLORS.warning};">${data.bookingTime}</td>
          </tr>
          ${data.notes ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; color: ${COLORS.textMuted};"><strong>Notes:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right; font-style: italic;">${data.notes}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 15px 0 0 0; font-size: 18px;"><strong>Total Revenue:</strong></td>
            <td style="padding: 15px 0 0 0; text-align: right; font-weight: bold; color: ${COLORS.primary}; font-size: 20px;">
              €${data.totalAmount}
            </td>
          </tr>
        </table>
      </div>
      
      <p style="color: ${COLORS.textMuted}; font-size: 14px; text-align: center;">You can review this inside your Supabase dashboard or Admin Panel bookings tab.</p>
    `;

    await resend.emails.send({
      from: `System <${settings.contact_email}>`,
      to: [settings.contact_email],
      subject: `🎉 NEW BOOKING: ${data.packageName} - ${data.bookingDate}`,
      html: renderEmailLayout(content, "New Booking Notification", "en", settings),
    });
  } catch (error) {
    console.error("Error sending admin notification email:", error);
  }
};
