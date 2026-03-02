import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

// Define email templates for each language with high-quality design matching lib/resend.ts
const EMAIL_TEMPLATES: Record<string, { subject: string; text: string; html: (name: string, url: string) => string }> = {
  en: {
    subject: "Your Istanbul Photoshoot is Waiting! 📸",
    text: "Hi there, we noticed you left your booking incomplete. Don't miss out on capturing your Istanbul memories!",
    html: (name, url) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Complete Your Booking</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px;">Hi ${name},</h2>
          <p style="color: #555; line-height: 1.5;">We noticed you started booking a photoshoot with <strong>Istanbul Portrait</strong> but didn't complete it.</p>
          <p style="color: #555; line-height: 1.5;">Your session slot is still reserved for a limited time. Don't miss the chance to capture your best memories in Istanbul!</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
           <a href="${url}" style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px; text-transform: uppercase;">Complete My Booking</a>
        </div>

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 8px;">Why Book Now?</h4>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">Slots fill up quickly, especially for sunset sessions. Secure your preferred time now.</p>
        </div>

        <div style="text-align: center; margin: 30px 0; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Have questions? Contact us at <a href="mailto:info@istanbulportrait.com" style="color: #2563eb; text-decoration: none;">info@istanbulportrait.com</a></p>
          <p style="color: #999; font-size: 12px;">Istanbul Photographer<br/>Istanbul, Turkey</p>
        </div>
      </div>
    `
  },
  ru: {
    subject: "Ваша фотосессия в Стамбуле ждет вас! 📸",
    text: "Здравствуйте, мы заметили, что вы не завершили бронирование.",
    html: (name, url) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Завершите бронирование</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px;">Здравствуйте, ${name},</h2>
          <p style="color: #555; line-height: 1.5;">Вы начали бронирование фотосессии в <strong>Istanbul Portrait</strong>, но не завершили его.</p>
          <p style="color: #555; line-height: 1.5;">Мы зарезервировали для вас время на короткий срок. Не упустите шанс запечатлеть лучшие моменты в Стамбуле!</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
           <a href="${url}" style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px; text-transform: uppercase;">Завершить бронирование</a>
        </div>

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 8px;">Почему сейчас?</h4>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">Места быстро заполняются, особенно на закате. Забронируйте удобное время сейчас.</p>
        </div>

        <div style="text-align: center; margin: 30px 0; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 5px;">Есть вопросы? Пишите нам: <a href="mailto:info@istanbulportrait.com" style="color: #2563eb; text-decoration: none;">info@istanbulportrait.com</a></p>
          <p style="color: #999; font-size: 12px;">Istanbul Photographer<br/>Istanbul, Turkey</p>
        </div>
      </div>
    `
  },
  es: {
    subject: "¡Tu sesión de fotos en Estambul te espera! 📸",
    text: "Hola, notamos que no completaste tu reserva. ¡No pierdas la oportunidad de capturar tus mejores recuerdos en Estambul!",
    html: (name, url) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center; margin-bottom: 30px;">Completa tu Reserva</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px;">Hola ${name},</h2>
          <p style="color: #555; line-height: 1.5;">Notamos que iniciaste una reserva con <strong>Istanbul Portrait</strong> pero no la completaste.</p>
          <p style="color: #555; line-height: 1.5;">Tu espacio sigue reservado por tiempo limitado. ¡No pierdas esta oportunidad!</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
           <a href="${url}" style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px; text-transform: uppercase;">Completar Reserva</a>
        </div>

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 8px;">¿Por qué ahora?</h4>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">Los horarios se llenan rápido, especialmente al atardecer. Asegura tu lugar.</p>
        </div>

        <div style="text-align: center; margin: 30px 0; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 5px;">¿Preguntas? Contáctanos: <a href="mailto:info@istanbulportrait.com" style="color: #2563eb; text-decoration: none;">info@istanbulportrait.com</a></p>
          <p style="color: #999; font-size: 12px;">Istanbul Photographer<br/>Istanbul, Turkey</p>
        </div>
      </div>
    `
  },
  ar: {
    subject: "جلسة التصوير الخاصة بك في إسطنبول بانتظارك! 📸",
    text: "مرحباً، لاحظنا أنك لم تكمل الحجز. لا تفوت فرصة توثيق ذكرياتك في إسطنبول!",
    html: (name, url) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
        <h1 style="color: #333; text-align: center; margin-bottom: 30px;">أكمل حجزك الآن</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px;">مرحباً ${name}،</h2>
          <p style="color: #555; line-height: 1.5;">لقد لاحظنا أنك بدأت في حجز جلسة تصوير مع <strong>Istanbul Portrait</strong> ولكنك لم تنهِ الخطوات.</p>
          <p style="color: #555; line-height: 1.5;">موعد جلستك لا يزال محجوزاً لفترة محدودة. لا تفوت فرصة التقاط أجمل الذكريات!</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
           <a href="${url}" style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px; text-transform: uppercase;">إكمال الحجز</a>
        </div>

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 8px;">لماذا الآن؟</h4>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">المواعيد تمتلئ بسرعة، خاصة وقت الغروب. احجز موعدك الآن.</p>
        </div>

        <div style="text-align: center; margin: 30px 0; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 5px;">لديك أسئلة؟ راسلنا: <a href="mailto:info@istanbulportrait.com" style="color: #2563eb; text-decoration: none;">info@istanbulportrait.com</a></p>
          <p style="color: #999; font-size: 12px;">Istanbul Photographer<br/>Istanbul, Turkey</p>
        </div>
      </div>
    `
  },
  zh: {
    subject: "您的伊斯坦布尔拍摄之旅正在等待！📸",
    text: "您好，我们注意到您未完成预订。别让伊斯坦布尔的美好回忆溜走！",
    html: (name, url) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; text-align: center; margin-bottom: 30px;">完成您的预订</h1>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0; font-size: 20px;">您好 ${name},</h2>
          <p style="color: #555; line-height: 1.5;">我们注意到您在 <strong>Istanbul Portrait</strong> 开始了预订，但尚未完成。</p>
          <p style="color: #555; line-height: 1.5;">您的拍摄时段暂时为您保留。千万别错过记录伊斯坦布尔美好瞬间的机会！</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
           <a href="${url}" style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 18px; text-transform: uppercase;">完成预订</a>
        </div>

        <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="color: #1e40af; margin-top: 0; margin-bottom: 8px;">为什么要现在预订？</h4>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">时段预订非常快，尤其是日落时分。请立即锁定您的时间。</p>
        </div>

        <div style="text-align: center; margin: 30px 0; border-top: 1px solid #eee; padding-top: 20px;">
          <p style="color: #666; font-size: 14px; margin-bottom: 5px;">有疑问？请联系：<a href="mailto:info@istanbulportrait.com" style="color: #2563eb; text-decoration: none;">info@istanbulportrait.com</a></p>
          <p style="color: #999; font-size: 12px;">Istanbul Photographer<br/>Istanbul, Turkey</p>
        </div>
      </div>
    `
  }
};

export async function GET(request: Request) {
  try {
    // 1. Calculate time windows
    // Look for drafts created between 4 hours ago and 24 hours ago
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // 2. Fetch abandoned drafts
    const { data: drafts, error } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("status", "draft")
      .eq("abandoned_email_sent", false)
      .lt("created_at", fourHoursAgo)
      .gt("created_at", twentyFourHoursAgo);

    if (error) throw error;
    if (!drafts || drafts.length === 0) {
      return NextResponse.json({ message: "No abandoned drafts found" });
    }

    const results = [];

    // 3. Process each draft
    for (const draft of drafts) {
      // Check if this user actually converted later (Created a confirmed booking AFTER the draft)
      const { data: converted } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("user_email", draft.user_email)
        .in("status", ["confirmed", "pending", "completed"])
        .gt("created_at", draft.created_at) // Must be created AFTER the draft
        .limit(1);

      if (converted && converted.length > 0) {
        // User already bought! Mark draft as handled without sending email
        await supabaseAdmin
          .from("bookings")
          .update({ abandoned_email_sent: true }) // Mark as processed
          .eq("id", draft.id);

        results.push({ id: draft.id, status: "already_converted" });
        continue;
      }

      // 4. Send Email
      const locale = draft.locale && EMAIL_TEMPLATES[draft.locale] ? draft.locale : "en";
      const template = EMAIL_TEMPLATES[locale] || EMAIL_TEMPLATES["en"];
      // Reconstruct checkout URL to deep link directly to the specific package
      const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/packages`;

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Istanbul Portrait <info@istanbulportrait.com>",
        to: [draft.user_email],
        subject: template.subject,
        html: template.html(draft.user_name, checkoutUrl),
      });

      if (emailError) {
        console.error("Failed to send email", emailError);
        results.push({ id: draft.id, status: "failed", error: emailError });
      } else {
        // 5. Mark as sent
        await supabaseAdmin
          .from("bookings")
          .update({ abandoned_email_sent: true })
          .eq("id", draft.id);

        results.push({ id: draft.id, status: "sent", emailId: emailData?.id });
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
