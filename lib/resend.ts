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
  },
};

const PRINT_EMAIL_TRANSLATIONS: Record<string, any> = {
  en: {
    subject: "Order Confirmation",
    title: "Order Confirmation",
    greeting: "Dear {name},",
    thankYou: "Thank you for your order from Istanbul Portrait Shop! We're preparing your prints.",
    detailsTitle: "Order Details",
    orderId: "Order ID",
    items: "Items",
    shippingTitle: "Shipping Address",
    total: "Total Amount",
    shippingCharge: "Shipping",
    tax: "Tax",
    whatsNext: "What's Next?",
    whatsNextDesc: "Your order will be processed and shipped shortly. You will receive another email when your order has been dispatched.",
    questions: "Have questions? Contact us at"
  },
  ru: {
    subject: "Подтверждение заказа",
    title: "Подтверждение заказа",
    greeting: "Уважаемый(ая) {name},",
    thankYou: "Благодарим за ваш заказ в Istanbul Portrait Shop! Мы готовим ваши отпечатки.",
    detailsTitle: "Детали заказа",
    orderId: "ID заказа",
    items: "Товары",
    shippingTitle: "Адрес доставки",
    total: "Общая сумма",
    shippingCharge: "Доставка",
    tax: "Налог",
    whatsNext: "Что дальше?",
    whatsNextDesc: "Ваш заказ будет обработан и отправлен в ближайшее время. Вы получите еще одно электронное письмо, когда ваш заказ будет отправлен.",
    questions: "Есть вопросы? Свяжитесь с нами по адресу"
  },
  es: {
    subject: "Confirmación del Pedido",
    title: "Confirmación del Pedido",
    greeting: "Estimado/a {name},",
    thankYou: "¡Gracias por su pedido en Istanbul Portrait Shop! Estamos preparando sus impresiones.",
    detailsTitle: "Detalles del Pedido",
    orderId: "ID del Pedido",
    items: "Artículos",
    shippingTitle: "Dirección de Envío",
    total: "Importe Total",
    shippingCharge: "Envío",
    tax: "Impuesto",
    whatsNext: "¿Qué Sigue?",
    whatsNextDesc: "Su pedido será procesado y enviado en breve. Recibirá otro correo electrónico cuando su pedido haya sido enviado.",
    questions: "¿Tiene preguntas? Contáctenos en"
  },
  ar: {
    subject: "تأكيد الطلب",
    title: "تأكيد الطلب",
    greeting: "عزيزي/عزيزتي {name}،",
    thankYou: "شكراً لطلبك من متجر Istanbul Portrait! نحن نقوم بتحضير طلبك الآن.",
    detailsTitle: "تفاصيل الطلب",
    orderId: "رقم الطلب",
    items: "المنتجات",
    shippingTitle: "عنوان الشحن",
    total: "المبلغ الإجمالي",
    shippingCharge: "الشحن",
    tax: "الضريبة",
    whatsNext: "ماذا بعد؟",
    whatsNextDesc: "سيتم معالجة طلبك وشحنه قريباً. ستتلقى بريداً إلكترونياً آخر عند شحن طلبك.",
    questions: "هل لديك أسئلة؟ تواصل معنا عبر"
  },
  zh: {
    subject: "订单确认",
    title: "订单确认",
    greeting: "亲爱的 {name}，",
    thankYou: "感谢您在 Istanbul Portrait 商店订购！我们正在准备您的打印件。",
    detailsTitle: "订单详情",
    orderId: "订单编号",
    items: "项目",
    shippingTitle: "送货地址",
    total: "总金额",
    shippingCharge: "运费",
    tax: "税费",
    whatsNext: "下一步是什么？",
    whatsNextDesc: "您的订单将很快得到处理和发货。订单发货后，您将收到另一封电子邮件通知。",
    questions: "有疑问？请联系"
  },
  de: {
    subject: "Bestellbestätigung",
    title: "Bestellbestätigung",
    greeting: "Hallo {name},",
    thankYou: "Vielen Dank für Ihre Bestellung im Istanbul Portrait Shop! Wir bereiten Ihre Drucke vor.",
    detailsTitle: "Bestelldetails",
    orderId: "Bestell-ID",
    items: "Artikel",
    shippingTitle: "Lieferadresse",
    total: "Gesamtbetrag",
    shippingCharge: "Versand",
    tax: "Steuer",
    whatsNext: "Wie geht es weiter?",
    whatsNextDesc: "Ihre Bestellung wird in Kürze bearbeitet und versendet. Sie erhalten eine weitere E-Mail, wenn Ihre Bestellung versandt wurde.",
    questions: "Haben Sie Fragen? Kontaktieren Sie uns unter"
  },
  fr: {
    subject: "Confirmation de Commande",
    title: "Confirmation de Commande",
    greeting: "Cher(e) {name},",
    thankYou: "Merci pour votre commande sur Istanbul Portrait Shop ! Nous préparons vos impressions.",
    detailsTitle: "Détails de la Commande",
    orderId: "ID de Commande",
    items: "Articles",
    shippingTitle: "Adresse de Livraison",
    total: "Montant Total",
    shippingCharge: "Livraison",
    tax: "Taxe",
    whatsNext: "Et ensuite ?",
    whatsNextDesc: "Votre commande sera traitée et expédiée sous peu. Vous recevrez un autre e-mail lorsque votre commande aura été expédiée.",
    questions: "Vous avez des questions ? Contactez-nous à"
  },
  ro: {
    subject: "Confirmare Comandă",
    title: "Confirmare Comandă",
    greeting: "Dragă {name},",
    thankYou: "Îți mulțumim pentru comanda de la Istanbul Portrait Shop! Pregătim printurile tale.",
    detailsTitle: "Detalii Comandă",
    orderId: "ID Comandă",
    items: "Produse",
    shippingTitle: "Adresa de Livrare",
    total: "Suma Totală",
    shippingCharge: "Livrare",
    tax: "Taxă",
    whatsNext: "Ce urmează?",
    whatsNextDesc: "Comanda ta va fi procesată și expediată în cel mai scurt timp. Vei primi un alt e-mail când comanda ta a fost expediată.",
    questions: "Ai întrebări? Contactează-ne la"
  }
};

const PRINT_SHIPPING_TRANSLATIONS: Record<string, any> = {
  en: {
    subject: "Your Order has Shipped!",
    title: "On its Way!",
    greeting: "Dear {name},",
    thankYou: "Great news! Your order from Istanbul Portrait Shop has been shipped and is on its way to you.",
    detailsTitle: "Shipping Details",
    orderId: "Order ID",
    carrier: "Carrier",
    trackingNumber: "Tracking Number",
    trackOrder: "Track Your Order",
    whatsNext: "What's Next?",
    whatsNextDesc: "Please note that it may take up to 24 hours for tracking information to be updated by the carrier.",
    questions: "Have questions? Contact us at"
  },
  ru: {
    subject: "Ваш заказ отправлен!",
    title: "Уже в пути!",
    greeting: "Уважаемый(ая) {name},",
    thankYou: "Отличные новости! Ваш заказ в Istanbul Portrait Shop был отправлен и уже в пути к вам.",
    detailsTitle: "Детали доставки",
    orderId: "ID заказа",
    carrier: "Перевозчик",
    trackingNumber: "Номер отслеживания",
    trackOrder: "Отследить заказ",
    whatsNext: "Что дальше?",
    whatsNextDesc: "Пожалуйста, обратите внимание, что обновление информации об отслеживании перевозчиком может занять до 24 часов.",
    questions: "Есть вопросы? Свяжитесь с нами по адресу"
  },
  es: {
    subject: "¡Su pedido ha sido enviado!",
    title: "¡En camino!",
    greeting: "Estimado/a {name},",
    thankYou: "¡Grandes noticias! Su pedido de Istanbul Portrait Shop ha sido enviado y está en camino.",
    detailsTitle: "Detalles del Envío",
    orderId: "ID del Pedido",
    carrier: "Transportista",
    trackingNumber: "Número de Seguimiento",
    trackOrder: "Rastrear Pedido",
    whatsNext: "¿Qué Sigue?",
    whatsNextDesc: "Tenga en cuenta que la información de seguimiento puede tardar hasta 24 horas en ser actualizada por el transportista.",
    questions: "¿Tiene preguntas? Contáctenos en"
  },
  ar: {
    subject: "تم شحن طلبك!",
    title: "في الطريق إليك!",
    greeting: "عزيزي/عزيزتي {name}،",
    thankYou: "أخبار رائعة! لقد تم شحن طلبك من متجر Istanbul Portrait وهو الآن في الطريق إليك.",
    detailsTitle: "تفاصيل الشحن",
    orderId: "رقم الطلب",
    carrier: "شركة الشحن",
    trackingNumber: "رقم التتبع",
    trackOrder: "تتبع طلبك",
    whatsNext: "ماذا بعد؟",
    whatsNextDesc: "يرجى العلم أن تحديث معلومات التتبع من قبل شركة الشحن قد يستغرق ما يصل إلى 24 ساعة.",
    questions: "هل لديك أسئلة؟ تواصل معنا عبر"
  },
  zh: {
    subject: "您的订单已发货！",
    title: "正在运送途中！",
    greeting: "亲爱的 {name}，",
    thankYou: "好消息！您在 Istanbul Portrait 商店订购的订单已发货，正前往您的途中。",
    detailsTitle: "发货信息",
    orderId: "订单编号",
    carrier: "承运人",
    trackingNumber: "运单号",
    trackOrder: "追踪订单",
    whatsNext: "下一步是什么？",
    whatsNextDesc: "请注意，承运人可能需要长达 24 小时才能更新追踪信息。",
    questions: "有疑问？请联系"
  },
  de: {
    subject: "Ihre Bestellung wurde versandt!",
    title: "Auf dem Weg!",
    greeting: "Hallo {name},",
    thankYou: "Gute Nachrichten! Ihre Bestellung im Istanbul Portrait Shop wurde versandt und ist auf dem Weg zu Ihnen.",
    detailsTitle: "Versanddetails",
    orderId: "Bestell-ID",
    carrier: "Versanddienstleister",
    trackingNumber: "Sendungsnummer",
    trackOrder: "Bestellung verfolgen",
    whatsNext: "Wie geht es weiter?",
    whatsNextDesc: "Bitte beachten Sie, dass es bis zu 24 Stunden dauern kann, bis die Tracking-Informationen vom Versanddienstleister aktualisiert werden.",
    questions: "Haben Sie Fragen? Kontaktieren Sie uns unter"
  },
  fr: {
    subject: "Votre commande a été expédiée !",
    title: "En route !",
    greeting: "Cher(e) {name},",
    thankYou: "Bonne nouvelle ! Votre commande sur Istanbul Portrait Shop a été expédiée et est en route.",
    detailsTitle: "Détails d'Expédition",
    orderId: "ID de Commande",
    carrier: "Transporteur",
    trackingNumber: "Numéro de Suivi",
    trackOrder: "Suivre la Commande",
    whatsNext: "Et ensuite ?",
    whatsNextDesc: "Veuillez noter que la mise à jour des informations de suivi par le transporteur peut prendre jusqu'à 24 heures.",
    questions: "Vous avez des questions ? Contactez-nous à"
  },
  ro: {
    subject: "Comanda ta a fost expediată!",
    title: "Pe drum!",
    greeting: "Dragă {name},",
    thankYou: "Vești bune! Comanda ta de la Istanbul Portrait Shop a fost expediată și este în drum spre tine.",
    detailsTitle: "Detalii de Expediere",
    orderId: "ID Comandă",
    carrier: "Transportator",
    trackingNumber: "Număr de AWB",
    trackOrder: "Urmărește Comanda",
    whatsNext: "Ce urmează?",
    whatsNextDesc: "Te rugăm să reții că actualizarea informațiilor de urmărire de către transportator poate dura până la 24 de ore.",
    questions: "Ai întrebări? Contactează-ne la"
  }
};

export interface PrintShippingNotificationData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  locale?: string;
}

export interface PrintOrderConfirmationItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PrintOrderConfirmationData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: PrintOrderConfirmationItem[];
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  totalAmount: number;
  currency: string;
  locale?: string;
}

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

export const sendPrintOrderConfirmation = async (
  data: PrintOrderConfirmationData,
) => {
  try {
    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "demo-resend-key"
    ) {
      throw new Error("Resend API key is not configured properly");
    }

    const locale = data.locale && PRINT_EMAIL_TRANSLATIONS[data.locale] ? data.locale : "en";
    const t = PRINT_EMAIL_TRANSLATIONS[locale];

    const result = await resend.emails.send({
      from: "Istanbul Portrait Shop <info@istanbulportrait.com>",
      to: [data.customerEmail],
      subject: `${t.subject} #${data.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; ${locale === 'ar' ? 'direction: rtl; text-align: right;' : ''}">
          <h1 style="color: #333; text-align: center;">${t.title}</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">${t.greeting.replace('{name}', data.customerName)}</h2>
            <p>${t.thankYou}</p>
          </div>

          <div style="border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">${t.detailsTitle}:</h3>
            <p><strong>${t.orderId}:</strong> ${data.orderId}</p>
            
            <h4 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">${t.items}</h4>
            <table style="width: 100%; border-collapse: collapse;">
              ${data.items.map(item => `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name} x ${item.quantity}</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${data.currency}${item.price.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr>
                <td style="padding: 15px 0 0 0;"><strong>${t.total}:</strong></td>
                <td style="padding: 15px 0 0 0; text-align: right; font-weight: bold; color: #2563eb; font-size: 1.2em;">
                  ${data.currency}${data.totalAmount.toFixed(2)}
                </td>
              </tr>
            </table>

            <div style="margin-top: 25px; padding-top: 15px; border-top: 2px solid #f0f0f0;">
              <h4 style="margin-top: 0; color: #333;">${t.shippingTitle}</h4>
              <p style="color: #666; margin-bottom: 0;">
                ${data.shippingAddress.line1}<br/>
                ${data.shippingAddress.line2 ? `${data.shippingAddress.line2}<br/>` : ''}
                ${data.shippingAddress.postalCode} ${data.shippingAddress.city}<br/>
                ${data.shippingAddress.country}
              </p>
            </div>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin-top: 0;">${t.whatsNext}</h4>
            <p style="margin: 0; color: #1e40af;">${t.whatsNextDesc}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p>${t.questions} <a href="mailto:info@istanbulportrait.com">info@istanbulportrait.com</a></p>
            <p style="color: #666; font-size: 14px;">Istanbul Portrait Shop<br/>Istanbul, Turkey</p>
          </div>
        </div>
      `,
    });

    return result;
  } catch (error) {
    console.error("Error sending print confirmation email:", error);
    throw error;
  }
};

export const sendPrintShippingNotification = async (
  data: PrintShippingNotificationData,
) => {
  try {
    if (
      !process.env.RESEND_API_KEY ||
      process.env.RESEND_API_KEY === "demo-resend-key"
    ) {
      throw new Error("Resend API key is not configured properly");
    }

    const locale = data.locale && PRINT_SHIPPING_TRANSLATIONS[data.locale] ? data.locale : "en";
    const t = PRINT_SHIPPING_TRANSLATIONS[locale];

    const result = await resend.emails.send({
      from: "Istanbul Portrait Shop <info@istanbulportrait.com>",
      to: [data.customerEmail],
      subject: `${t.subject} #${data.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; ${locale === 'ar' ? 'direction: rtl; text-align: right;' : ''}">
          <h1 style="color: #333; text-align: center;">${t.title}</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">${t.greeting.replace('{name}', data.customerName)}</h2>
            <p>${t.thankYou}</p>
          </div>

          <div style="border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">${t.detailsTitle}:</h3>
            <p><strong>${t.orderId}:</strong> ${data.orderId}</p>
            <p><strong>${t.carrier}:</strong> ${data.carrier}</p>
            <p><strong>${t.trackingNumber}:</strong> ${data.trackingNumber}</p>
            
            <div style="margin-top: 20px; text-align: center;">
              <a href="${data.trackingUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                ${t.trackOrder}
              </a>
            </div>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1e40af; margin-top: 0;">${t.whatsNext}</h4>
            <p style="margin: 0; color: #1e40af;">${t.whatsNextDesc}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p>${t.questions} <a href="mailto:info@istanbulportrait.com">info@istanbulportrait.com</a></p>
            <p style="color: #666; font-size: 14px;">Istanbul Portrait Shop<br/>Istanbul, Turkey</p>
          </div>
        </div>
      `,
    });

    return result;
  } catch (error) {
    console.error("Error sending shipping notification email:", error);
    throw error;
  }
};
