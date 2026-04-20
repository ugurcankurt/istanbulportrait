import { Resend } from "resend";
import type { SiteSettings } from "./settings-service";
import { EMAIL_TRANSLATIONS, NEWSLETTER_TRANSLATIONS, ABANDONED_TRANSLATIONS } from "./email-translations";

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

  // Clean the URLs to route through our own domain (to satisfy Resend Domain Verification)
  const appBaseUrl = settings.app_base_url || process.env.NEXT_PUBLIC_APP_URL || "https://istanbulportrait.com";
  const supabasePrefix = "https://xfntnamwfnqjgqmyxwfz.supabase.co/storage/v1/object/public";
  
  const cleanUrl = (url?: string | null) => {
    if (!url) return "";
    return url.replace(supabasePrefix, `${appBaseUrl}/storage`);
  };

  // Header Logo logic (users dark logo on primary bg)
  const headerLogo = cleanUrl(settings.logo_dark_url);

  // Footer logo logic
  const footerLogo = cleanUrl(isDark ? settings.logo_dark_url : settings.logo_url);

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
  discountAmount?: number;
  depositAmount?: number;
  remainingAmount?: number;
  promoCode?: string;
  bookingId: string;
  peopleCount?: number;
  locale?: string;
  notes?: string;
  packageId?: string;
}


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
          ${data.discountAmount && data.discountAmount > 0 ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px dotted ${colors.border}; color: ${colors.textMuted};"><strong>${t.originalPrice}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px dotted ${colors.border}; text-align: right; color: ${colors.textMuted}; text-decoration: line-through;">€${data.originalAmount}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: #16a34a;"><strong>${t.discount}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: #16a34a;">-€${data.discountAmount}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 15px 0 10px 0; font-size: 16px; color: ${colors.text}; border-bottom: 1px dashed ${colors.border};"><strong>${t.total}:</strong></td>
            <td style="padding: 15px 0 10px 0; text-align: right; font-weight: bold; color: ${colors.text}; font-size: 16px; border-bottom: 1px dashed ${colors.border};">
              €${data.totalAmount}
            </td>
          </tr>
          ${data.depositAmount !== undefined ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px dotted ${colors.border}; color: ${colors.textMuted};"><strong>${t.depositPaid}:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px dotted ${colors.border}; text-align: right; color: ${colors.text};">€${data.depositAmount}</td>
          </tr>` : ""}
          ${data.remainingAmount !== undefined ? `
          <tr>
            <td style="padding: 15px 0 0 0; font-size: 18px; color: ${colors.text};"><strong>${t.remainingCash}:</strong></td>
            <td style="padding: 15px 0 0 0; text-align: right; font-weight: bold; color: ${colors.primary}; font-size: 20px;">
              €${data.remainingAmount}
            </td>
          </tr>` : ""}
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
          ${data.promoCode ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted};"><strong>Promo Code:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; font-weight: bold; color: ${colors.primary};">${data.promoCode}</td>
          </tr>` : ""}
          ${data.discountAmount && data.discountAmount > 0 ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px dotted ${colors.border}; color: ${colors.textMuted};"><strong>Original Price:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px dotted ${colors.border}; text-align: right; color: ${colors.textMuted}; text-decoration: line-through;">€${data.originalAmount}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: #16a34a;"><strong>Discount / Promo:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: #16a34a;">-€${data.discountAmount}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 15px 0 10px 0; font-size: 16px; color: ${colors.text}; border-bottom: 1px dashed ${colors.border};"><strong>Total Selected Price:</strong></td>
            <td style="padding: 15px 0 10px 0; text-align: right; font-weight: bold; color: ${colors.text}; font-size: 16px; border-bottom: 1px dashed ${colors.border};">
              €${data.totalAmount}
            </td>
          </tr>
          ${data.depositAmount !== undefined ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px dotted ${colors.border}; color: ${colors.textMuted};"><strong>Deposit Paid:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px dotted ${colors.border}; text-align: right; color: ${colors.text};">€${data.depositAmount}</td>
          </tr>` : ""}
          ${data.remainingAmount !== undefined ? `
          <tr>
            <td style="padding: 15px 0 0 0; font-size: 18px; color: ${colors.text};"><strong>Remaining (Cash):</strong></td>
            <td style="padding: 15px 0 0 0; text-align: right; font-weight: bold; color: ${colors.primary}; font-size: 20px;">
              €${data.remainingAmount}
            </td>
          </tr>` : ""}
        </table>
      </div>
      
      <p style="color: ${colors.textMuted}; font-size: 14px; text-align: center;">You can review this inside your Admin Panel bookings tab.</p>
    `;

    await resend.emails.send({
      from: `System <${settings.contact_email}>`,
      to: ["razor.girdap@gmail.com"],
      subject: `🎉 NEW BOOKING: ${data.packageName} - ${data.bookingDate}`,
      html: renderEmailLayout(content, "New Booking Notification", "en", settings),
    });
  } catch (error) {
    console.error("Error sending admin notification email:", error);
  }
};

export const sendAbandonedBookingEmail = async (
  data: BookingConfirmationData,
  settings: SiteSettings,
) => {
  try {
    const apiKey =
      settings.resend_api_key || process.env.RESEND_API_KEY || "demo-resend-key";
      
    console.log("Abandoned Email Execution Check:", { 
      hasApiKey: !!apiKey && apiKey !== "demo-resend-key",
      contactEmail: settings.contact_email
    });

    if (!apiKey || apiKey === "demo-resend-key") {
      console.warn("WARNING: Abandoned Email skipped. API Key is missing or default.");
      return;
    }

    const resend = new Resend(apiKey);
    const colors = getEmailColors(settings);

    const locale = data.locale && ABANDONED_TRANSLATIONS[data.locale] ? data.locale : "en";
    const t = ABANDONED_TRANSLATIONS[locale];

    const checkoutUrl = `${settings.app_base_url || process.env.NEXT_PUBLIC_APP_URL || "https://istanbulportrait.com"}/${locale}/checkout?package=${data.packageId}`;

    const content = `
      <h2 style="color: ${colors.text}; margin-top: 0; font-size: 24px;">${t.greeting.replace("{name}", data.customerName.split(' ')[0])}</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: ${colors.textMuted};">
        ${t.body1.replace("{package}", data.packageName).replace("{date}", data.bookingDate).replace("{time}", data.bookingTime)}
      </p>

      <div style="background: ${settings.color_mode === "dark" ? "#1e1e24" : "#fafafa"}; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid ${colors.warning};">
        <p style="margin: 0; color: ${colors.text}; font-size: 15px; line-height: 1.5;">${t.body2}</p>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${checkoutUrl}" style="background-color: ${colors.primary}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
          ${t.button}
        </a>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <p style="color: ${colors.textMuted}; font-size: 14px;">
          ${t.questions} <a href="mailto:${settings.contact_email}" style="color: ${colors.primary}; text-decoration: none; font-weight: bold;">${settings.contact_email}</a>
        </p>
      </div>
    `;

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: `${settings.site_name || "Photographer"} <${settings.contact_email || "onboarding@resend.dev"}>`,
      to: [data.customerEmail],
      subject: t.subject,
      html: renderEmailLayout(content, t.title, locale, settings),
    });

    if (resendError) {
      console.error("Resend Abandoned Email Error:", resendError);
      throw resendError;
    } else {
      console.log("Resend Abandoned Email Sent Successfully:", resendData);
    }
  } catch (error) {
    console.error("Error sending abandoned booking email:", error);
    throw error;
  }
};
// ─── NEWSLETTER WELCOME NOTIFICATION ──────────────────────────

export const sendNewsletterWelcomeEmail = async (
  email: string,
  promoCode: string,
  promoPercentage: number,
  settings: SiteSettings,
  locale: string = "en",
) => {
  try {
    const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY || "demo-resend-key";
    if (!apiKey || apiKey === "demo-resend-key") return;

    const resend = new Resend(apiKey);
    const colors = getEmailColors(settings);
    const t = NEWSLETTER_TRANSLATIONS[locale] || NEWSLETTER_TRANSLATIONS["en"];

    const content = `
      <h2 style="color: ${colors.text}; margin-top: 0; font-size: 24px;">${t.title}</h2>
      <p style="font-size: 16px; line-height: 1.6; color: ${colors.textMuted};">${t.greeting}</p>
      
      <p style="font-size: 16px; line-height: 1.6; color: ${colors.textMuted};">${t.body1}</p>

      <div style="background-color: ${colors.background}; border: 1px dashed ${colors.primary}; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
        <p style="font-size: 15px; color: ${colors.textMuted}; margin-top: 0; margin-bottom: 10px;">${t.body2}</p>
        <div style="font-size: 32px; font-weight: bold; color: ${colors.primary}; letter-spacing: 2px;">
          ${promoCode}
        </div>
        <p style="font-size: 14px; color: #10b981; margin-top: 10px; margin-bottom: 0;">
          (-%${promoPercentage} Discount)
        </p>
      </div>

      <div style="text-align: center; margin: 35px 0;">
         <a href="${settings.app_base_url || 'https://istanbulportrait.com'}/${locale}/packages" style="background-color: ${colors.primary}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">${t.button}</a>
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <p style="color: ${colors.textMuted}; font-size: 14px;">
          ${t.questions} <a href="mailto:${settings.contact_email}" style="color: ${colors.primary}; text-decoration: none; font-weight: bold;">${settings.contact_email}</a>
        </p>
      </div>
    `;

    await resend.emails.send({
      from: `${settings.site_name || "Photographer"} <${settings.contact_email || 'hello@istanbulportrait.com'}>`, // Needs a verified domain like newsletter@istanbulportrait.com
      to: [email],
      subject: t.title,
      html: renderEmailLayout(content, t.title, locale, settings),
    });
    console.log("Newsletter welcome email dispatched successfully.");
  } catch (error) {
    console.error("Error sending newsletter welcome email:", error);
  }
};

// ─── LEAD NOTIFICATION ────────────────────────────────────────

export interface LeadNotificationData {
  source: string;
  campaignId?: string;
  formId?: string;
  fields: Record<string, string>;
}

export const sendAdminLeadNotification = async (
  data: LeadNotificationData,
  settings: SiteSettings,
) => {
  try {
    const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY || "demo-resend-key";
    if (!apiKey || apiKey === "demo-resend-key") return;
    if (!settings.contact_email) return;

    const resend = new Resend(apiKey);
    const colors = getEmailColors(settings);
    const detailsBg = settings.color_mode === "dark" ? "#1e1e24" : "#fafafa";

    const fieldsRows = Object.entries(data.fields)
      .map(([key, value]) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted}; font-size: 14px; word-break: break-all; max-width: 150px;"><strong>${key}:</strong></td>
          <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.text}; font-weight: 500;">${value}</td>
        </tr>
      `)
      .join("");

    const content = `
      <h2 style="color: ${colors.text}; margin-top: 0; font-size: 24px;">New Lead Received! 📈</h2>
      <p style="font-size: 16px; line-height: 1.6; color: ${colors.textMuted};">You have just received an automatic lead submission from <strong>${data.source}</strong>.</p>

      <div style="border: 1px solid ${colors.border}; padding: 25px; border-radius: 12px; margin: 30px 0; background-color: ${detailsBg};">
        <h3 style="color: ${colors.primary}; margin-top: 0; font-size: 18px; text-transform: uppercase;">Lead Details</h3>
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          ${data.campaignId ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted}; font-size: 14px;"><strong>Campaign ID:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.warning}; font-weight: bold;">${data.campaignId}</td>
          </tr>` : ""}
          ${data.formId ? `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textMuted}; font-size: 14px;"><strong>Form ID:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid ${colors.border}; text-align: right; color: ${colors.primary}; font-weight: bold;">${data.formId}</td>
          </tr>` : ""}
          ${fieldsRows}
        </table>
      </div>
      
      <p style="color: ${colors.textMuted}; font-size: 14px; text-align: center;">You can view more details in your database.</p>
    `;

    // Only sending to admin_email. Falling back to contact_email.
    const recipient = settings.admin_email || settings.contact_email;
    const fromDomainEmail = `System <${settings.contact_email}>`;
    
    await resend.emails.send({
      from: fromDomainEmail,
      to: [recipient],
      subject: `🟢 NEW LEAD: ${data.source}`,
      html: renderEmailLayout(content, "New Lead Notification", "en", settings),
    });
  } catch (error) {
    console.error("Error sending lead admin notification email:", error);
  }
};

