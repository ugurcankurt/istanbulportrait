import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "demo-resend-key");

export interface BookingConfirmationData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  bookingDate: string;
  bookingTime: string;
  totalAmount: number;
  originalAmount?: number;
  discountAmount?: number;
  bookingId: string;
  peopleCount?: number;
  depositAmount?: number;
  remainingAmount?: number;
  locale?: string;
}

const EMAIL_TRANSLATIONS: Record<string, any> = {
  en: {
    subject: "Booking Confirmation",
    title: "Booking Confirmation",
    greeting: "Dear {name},",
    thankYou: "Thank you for booking with Istanbul Portrait! Your booking has been confirmed.",
    detailsTitle: "Booking Details",
    bookingId: "Booking ID",
    package: "Package",
    peopleCount: "Number of People",
    date: "Date",
    time: "Time",
    total: "Total Amount",
    discount: "Seasonal Discount",
    deposit: "Deposit Paid",
    remaining: "Remaining Balance (Cash)",
    remainingNote: "Please pay the remaining balance in cash on the day of your photoshoot.",
    whatsNext: "What's Next?",
    whatsNextDesc: "We will contact you 24 hours before your session to confirm the location and any special requirements.",
    questions: "Have questions? Contact us at"
  },
  ru: {
    subject: "Подтверждение бронирования",
    title: "Подтверждение бронирования",
    greeting: "Уважаемый(ая) {name},",
    thankYou: "Спасибо за бронирование в Istanbul Portrait! Ваше бронирование подтверждено.",
    detailsTitle: "Детали бронирования",
    bookingId: "ID бронирования",
    package: "Пакет",
    peopleCount: "Количество человек",
    date: "Дата",
    time: "Время",
    total: "Общая сумма",
    discount: "Сезонная скидка",
    deposit: "Оплаченный депозит",
    remaining: "Остаток к оплате (наличными)",
    remainingNote: "Пожалуйста, оплатите оставшуюся сумму наличными в день фотосессии.",
    whatsNext: "Что дальше?",
    whatsNextDesc: "Мы свяжемся с вами за 24 часа до сессии, чтобы подтвердить место проведения и особые пожелания.",
    questions: "Есть вопросы? Свяжитесь с нами:"
  },
  es: {
    subject: "Confirmación de Reserva",
    title: "Confirmación de Reserva",
    greeting: "Estimado/a {name},",
    thankYou: "¡Gracias por reservar con Istanbul Portrait! Su reserva ha sido confirmada.",
    detailsTitle: "Detalles de la Reserva",
    bookingId: "ID de Reserva",
    package: "Paquete",
    peopleCount: "Número de Personas",
    date: "Fecha",
    time: "Hora",
    total: "Importe Total",
    discount: "Descuento de Temporada",
    deposit: "Depósito Pagado",
    remaining: "Saldo Pendiente (Efectivo)",
    remainingNote: "Por favor, pague el saldo pendiente en efectivo el día de su sesión fotográfica.",
    whatsNext: "¿Qué Sigue?",
    whatsNextDesc: "Nos pondremos en contacto con usted 24 horas antes de su sesión para confirmar la ubicación y cualquier requisito especial.",
    questions: "¿Tiene preguntas? Contáctenos en"
  },
  ar: {
    subject: "تأكيد الحجز",
    title: "تأكيد الحجز",
    greeting: "عزيزي/عزيزتي {name}،",
    thankYou: "شكراً لحجزك مع Istanbul Portrait! لقد تم تأكيد حجزك.",
    detailsTitle: "تفاصيل الحجز",
    bookingId: "رقم الحجز",
    package: "الباقة",
    peopleCount: "عدد الأشخاص",
    date: "التاريخ",
    time: "الوقت",
    total: "المبلغ الإجمالي",
    discount: "خصم موسمي",
    deposit: "العربون المدفوع",
    remaining: "المبلغ المتبقي (نقداً)",
    remainingNote: "يرجى دفع المبلغ المتبقي نقداً في يوم جلسة التصوير.",
    whatsNext: "ماذا بعد؟",
    whatsNextDesc: "سنتواصل معك قبل 24 ساعة من الجلسة لتأكيد الموقع وأي متطلبات خاصة.",
    questions: "هل لديك أسئلة؟ تواصل معنا عبر"
  },
  zh: {
    subject: "预订确认",
    title: "预订确认",
    greeting: "亲爱的 {name}，",
    thankYou: "感谢您在 Istanbul Portrait 预订！您的预订已确认。",
    detailsTitle: "预订详情",
    bookingId: "预订编号",
    package: "套餐",
    peopleCount: "人数",
    date: "日期",
    time: "时间",
    total: "总金额",
    discount: "季节性折扣",
    deposit: "已付定金",
    remaining: "剩余余额（现金）",
    remainingNote: "请在拍摄当天以现金支付剩余余额。",
    whatsNext: "下一步是什么？",
    whatsNextDesc: "我们将在您的拍摄前 24 小时与您联系，以确认地点和任何特殊要求。",
    questions: "有疑问？请联系"
  },
  de: {
    subject: "Buchungsbestätigung",
    title: "Buchungsbestätigung",
    greeting: "Hallo {name},",
    thankYou: "Vielen Dank für Ihre Buchung bei Istanbul Portrait! Ihre Buchung wurde bestätigt.",
    detailsTitle: "Buchungsdetails",
    bookingId: "Buchungs-ID",
    package: "Paket",
    peopleCount: "Anzahl Personen",
    date: "Datum",
    time: "Uhrzeit",
    total: "Gesamtbetrag",
    discount: "Saisonaler Rabatt",
    deposit: "Gezahlte Anzahlung",
    remaining: "Restbetrag (Bar)",
    remainingNote: "Bitte zahlen Sie den Restbetrag am Tag Ihres Fotoshootings in bar.",
    whatsNext: "Wie geht es weiter?",
    whatsNextDesc: "Wir werden Sie 24 Stunden vor Ihrem Fotoshooting kontaktieren, um den Ort und besondere Anforderungen zu bestätigen.",
    questions: "Haben Sie Fragen? Kontaktieren Sie uns unter"
  },
  fr: {
    subject: "Confirmation de Réservation",
    title: "Confirmation de Réservation",
    greeting: "Cher(e) {name},",
    thankYou: "Merci d'avoir réservé avec Istanbul Portrait ! Votre réservation est confirmée.",
    detailsTitle: "Détails de la Réservation",
    bookingId: "ID de Réservation",
    package: "Forfait",
    peopleCount: "Nombre de personnes",
    date: "Date",
    time: "Heure",
    total: "Montant Total",
    discount: "Remise Saisonnière",
    deposit: "Acompte Payé",
    remaining: "Solde Restant (Espèces)",
    remainingNote: "Veuillez payer le solde restant en espèces le jour de votre séance photo.",
    whatsNext: "Et ensuite ?",
    whatsNextDesc: "Nous vous contacterons 24 heures avant votre séance pour confirmer l'emplacement et vos exigences particulières.",
    questions: "Vous avez des questions ? Contactez-nous à"
  },
  ro: {
    subject: "Confirmare Rezervare",
    title: "Confirmare Rezervare",
    greeting: "Dragă {name},",
    thankYou: "Îți mulțumim pentru rezervarea la Istanbul Portrait! Rezervarea ta a fost confirmată.",
    detailsTitle: "Detalii Rezervare",
    bookingId: "ID Rezervare",
    package: "Pachet",
    peopleCount: "Număr de Persoane",
    date: "Data",
    time: "Ora",
    total: "Suma Totală",
    discount: "Reducere de Sezon",
    deposit: "Avans Plătit",
    remaining: "Rest de Plată (Cash)",
    remainingNote: "Te rugăm să achiți restul de plată în numerar (cash) în ziua ședinței foto.",
    whatsNext: "Ce urmează?",
    whatsNextDesc: "Te vom contacta cu 24 de ore înainte de sesiune pentru a confirma locația și alte detalii.",
    questions: "Ai întrebări? Contactează-ne la"
  }
};

export const sendBookingConfirmation = async (
  data: BookingConfirmationData,
) => {
  try {
    // Check if we have a valid API key
    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "demo-resend-key"
    ) {
      throw new Error("Resend API key is not configured properly");
    }

    const locale = data.locale && EMAIL_TRANSLATIONS[data.locale] ? data.locale : "en";
    const t = EMAIL_TRANSLATIONS[locale];

    const result = await resend.emails.send({
      from: "Photographer in Istanbul <info@istanbulportrait.com>",
      to: [data.customerEmail],
      subject: `${t.subject} - ${data.packageName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; ${locale === 'ar' ? 'direction: rtl; text-align: right;' : ''}">
          <h1 style="color: #333; text-align: center;">${t.title}</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">${t.greeting.replace('{name}', data.customerName)}</h2>
            <p>${t.thankYou}</p>
          </div>

          <div style="border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">${t.detailsTitle}:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${t.bookingId}:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${t.package}:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.packageName}</td>
              </tr>
              ${data.peopleCount && data.peopleCount > 1
          ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${t.peopleCount}:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.peopleCount}</td>
              </tr>
              `
          : ""
        }
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${t.date}:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.bookingDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>${t.time}:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${data.bookingTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>${t.total}:</strong></td>
                <td style="padding: 8px 0; font-weight: bold; color: #2563eb;">
                  ${data.originalAmount &&
          data.originalAmount > data.totalAmount
          ? `<span style="text-decoration: line-through; color: #666; font-weight: normal; font-size: 0.9em; margin-right: 8px;">€${data.originalAmount}</span>`
          : ""
        }
                  €${data.totalAmount}
                </td>
              </tr>
              ${data.discountAmount && data.discountAmount > 0
          ? `
              <tr>
                <td style="padding: 8px 0; color: #16a34a; font-size: 0.9em;"><strong>${t.discount}:</strong></td>
                <td style="padding: 8px 0; color: #16a34a; font-size: 0.9em;">-€${data.discountAmount}</td>
              </tr>
              `
          : ""
        }
            </table>
            
            <div style="margin-top: 15px; border-top: 1px dashed #eee; padding-top: 15px;">
              <table style="width: 100%; border-collapse: collapse;">
                 ${data.depositAmount
          ? `
                <tr>
                  <td style="padding: 8px 0; color: #059669;"><strong>${t.deposit} (30%):</strong></td>
                  <td style="padding: 8px 0; color: #059669; font-weight: bold;">€${data.depositAmount}</td>
                </tr>
                `
          : ""
        }
                 ${data.remainingAmount
          ? `
                <tr>
                  <td style="padding: 8px 0; color: #b91c1c;"><strong>${t.remaining} (70%):</strong></td>
                  <td style="padding: 8px 0; color: #b91c1c; font-weight: bold;">€${data.remainingAmount}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 0; font-size: 0.85em; color: #666; font-style: italic;">
                    * ${t.remainingNote}
                  </td>
                </tr>
                `
          : ""
        }
              </table>
            </div>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin-top: 0;">${t.whatsNext}</h4>
            <p style="margin: 0; color: #1e40af;">${t.whatsNextDesc}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p>${t.questions} <a href="mailto:info@istanbulportrait.com">info@istanbulportrait.com</a></p>
            <p style="color: #666; font-size: 14px;">Istanbul Photographer<br/>Istanbul, Turkey</p>
          </div>
        </div>
      `,
    });

    return result;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    throw error;
  }
};

export const addContactToAudience = async (
  email: string,
  firstName: string,
  lastName?: string,
  audienceId: string = process.env.RESEND_AUDIENCE_ID || "",
) => {
  try {
    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "demo-resend-key"
    ) {
      console.warn("Resend API key missing, skipping contact creation");
      return;
    }

    // Prepare contact data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contactData: any = {
      email,
      firstName,
      lastName,
      unsubscribed: false,
    };

    // Only add audienceId if it's explicitly provided/set in env
    if (audienceId) {
      contactData.audienceId = audienceId;
    }

    await resend.contacts.create(contactData);
    console.log(`Successfully added contact ${email} to Resend Audience`);
  } catch (error) {
    // We log the error but don't throw it, as this is a non-critical background task
    // Often fails if contact already exists, which is fine
    console.error("Failed to add contact to Resend Audience:", error);
  }
};
